# -*- coding: utf-8 -*-
"""
Ponto de entrada principal da aplicação Mozaia LLM Orchestrator.

Versão enterprise que integra a arquitetura completa com observabilidade,
resiliência, monitoramento e gestão robusta de recursos.
"""
from __future__ import annotations

import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

import aiohttp
import uvicorn
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, ConfigDict
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.orchestrator import LLMOrchestrator
from app.schemas import GenerationParams, OrchestratorResponse, ContextType
from app.core.exceptions import (
    InvalidInputError, LLMRateLimitError, ConsensusError, 
    LLMServiceError, LLMError
)
from app.core.factory import LLMFactory
from app.core.pool import LLMPool, PoolConfig


# Configuração avançada de logging
def setup_logging():
    """Configura sistema de logging estruturado."""
    log_level = logging.DEBUG if settings.debug else logging.INFO
    
    # Formato estruturado para logs
    log_format = (
        "%(asctime)s | %(name)s | %(levelname)s | "
        "%(funcName)s:%(lineno)d | %(message)s"
    )
    
    # Configuração do handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(log_format))
    
    # Logger raiz
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)
    
    # Suprime logs verbosos de libraries externas
    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)


logger = setup_logging()


# --- Middleware de Monitoramento ---

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware para coleta de métricas de performance."""
    
    def __init__(self, app):
        super().__init__(app)
        self.request_count = 0
        self.error_count = 0
        self.total_request_time = 0.0

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        self.request_count += 1
        
        try:
            response = await call_next(request)
            
            # Log de sucesso
            duration = time.time() - start_time
            self.total_request_time += duration
            
            logger.info(
                f"Request completed | "
                f"method={request.method} | "
                f"path={request.url.path} | "
                f"status={response.status_code} | "
                f"duration={duration:.3f}s"
            )
            
            # Adiciona headers de timing
            response.headers["X-Process-Time"] = str(duration)
            response.headers["X-Request-ID"] = str(self.request_count)
            
            return response
            
        except Exception as e:
            self.error_count += 1
            duration = time.time() - start_time
            
            logger.error(
                f"Request failed | "
                f"method={request.method} | "
                f"path={request.url.path} | "
                f"error={str(e)} | "
                f"duration={duration:.3f}s"
            )
            raise

    @property
    def metrics(self) -> Dict[str, Any]:
        """Retorna métricas coletadas."""
        avg_time = (self.total_request_time / self.request_count 
                   if self.request_count > 0 else 0)
        
        return {
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "error_rate": self.error_count / max(self.request_count, 1),
            "average_response_time": avg_time,
            "total_request_time": self.total_request_time
        }


# --- Gestão do Ciclo de Vida ---

class AppComponents:
    """Container para componentes da aplicação."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.factory: Optional[LLMFactory] = None
        self.pool: Optional[LLMPool] = None
        self.orchestrator: Optional[LLMOrchestrator] = None
        self.metrics_middleware: Optional[MetricsMiddleware] = None
        self.startup_time: Optional[float] = None

    async def initialize(self) -> None:
        """Inicializa todos os componentes da aplicação."""
        try:
            startup_start = time.time()
            logger.info("Iniciando inicialização da aplicação...")
            
            # 1. Validação de configurações críticas
            await self._validate_configuration()
            
            # 2. Criação da sessão aiohttp com configurações otimizadas
            connector = aiohttp.TCPConnector(
                limit=settings.http.max_connections,
                limit_per_host=settings.http.max_connections_per_host,
                ttl_dns_cache=300,
                use_dns_cache=True,
                keepalive_timeout=30,
                enable_cleanup_closed=True
            )
            
            timeout = aiohttp.ClientTimeout(
                total=settings.http.total_timeout,
                connect=settings.http.connect_timeout
            )
            
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={
                    "User-Agent": f"Mozaia-LLM-Orchestrator/{settings.app_version}"
                }
            )
            logger.info("Sessão HTTP inicializada")
            
            # 3. Criação e configuração da fábrica de LLMs
            self.factory = LLMFactory(self.session)
            logger.info(f"Factory inicializada com {len(self.factory.get_available_models())} modelos")
            
            # 4. Configuração e criação do pool de LLMs
            pool_config = PoolConfig(
                max_size_per_model=settings.pool.max_size,
                min_size_per_model=settings.pool.min_size,
                idle_timeout=settings.pool.idle_timeout_sec,
                warmup_size=settings.pool.warmup_size,
                health_check_interval=settings.pool.health_check_interval,
                max_acquisition_wait=settings.pool.max_acquisition_wait,
                enable_health_checks=True,
                enable_metrics=True
            )
            
            self.pool = LLMPool(self.factory, pool_config)
            logger.info("Pool de LLMs inicializado")
            
            # 5. Preload de modelos críticos se configurado
            if hasattr(settings, 'preload_models') and settings.preload_models:
                await self._preload_critical_models()
            
            # 6. Criação e inicialização do orquestrador
            self.orchestrator = LLMOrchestrator(self.pool)
            await self.orchestrator.initialize()
            logger.info("Orquestrador inicializado")
            
            # 7. Validação de saúde dos componentes
            await self._health_validation()
            
            self.startup_time = time.time() - startup_start
            logger.info(f"Aplicação inicializada com sucesso em {self.startup_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Falha na inicialização da aplicação: {e}", exc_info=True)
            await self.cleanup()
            raise

    async def _validate_configuration(self) -> None:
        """Valida configurações críticas da aplicação."""
        required_settings = [
            'models.ollama_llama_model',
            'models.ollama_gemma_model', 
            'models.openrouter_qwen_model'
        ]
        
        for setting_path in required_settings:
            value = settings
            for part in setting_path.split('.'):
                value = getattr(value, part, None)
                if value is None:
                    raise ValueError(f"Configuração obrigatória ausente: {setting_path}")
        
        logger.info("Configurações validadas")

    async def _preload_critical_models(self) -> None:
        """Pré-carrega modelos críticos para reduzir latência inicial."""
        critical_models = [
            settings.models.ollama_llama_model,
            settings.models.openrouter_qwen_model
        ]
        
        preload_tasks = []
        for model in critical_models:
            if await self.pool.validate_model(model):
                task = self.pool.preload_model(model, count=2)
                preload_tasks.append(task)
        
        if preload_tasks:
            results = await asyncio.gather(*preload_tasks, return_exceptions=True)
            total_preloaded = sum(r for r in results if isinstance(r, int))
            logger.info(f"Pré-carregadas {total_preloaded} instâncias de modelos críticos")

    async def _health_validation(self) -> None:
        """Valida a saúde dos componentes após inicialização."""
        # Testa criação de instância LLM
        test_model = settings.models.ollama_llama_model
        
        try:
            async with self.pool.acquire(test_model) as llm:
                if hasattr(llm, 'health_check'):
                    is_healthy = await llm.health_check()
                    if not is_healthy:
                        raise RuntimeError(f"Health check falhou para {test_model}")
            
            logger.info("Validação de saúde concluída com sucesso")
            
        except Exception as e:
            logger.warning(f"Validação de saúde com problemas: {e}")

    async def cleanup(self) -> None:
        """Limpa todos os recursos da aplicação."""
        logger.info("Iniciando limpeza de recursos...")
        
        cleanup_tasks = []
        
        if self.pool:
            cleanup_tasks.append(self.pool.close_all())
        
        if self.session:
            cleanup_tasks.append(self.session.close())
        
        if cleanup_tasks:
            await asyncio.gather(*cleanup_tasks, return_exceptions=True)
        
        logger.info("Limpeza de recursos concluída")


# Instância global dos componentes
app_components = AppComponents()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida completo da aplicação."""
    try:
        await app_components.initialize()
        
        # Adiciona componentes ao estado da aplicação
        app.state.orchestrator = app_components.orchestrator
        app.state.pool = app_components.pool
        app.state.factory = app_components.factory
        app.state.components = app_components
        
        yield
        
    except Exception as e:
        logger.error(f"Erro no lifespan da aplicação: {e}", exc_info=True)
        raise
    finally:
        await app_components.cleanup()


# --- Configuração da Aplicação FastAPI ---

app = FastAPI(
    title="Mozaia LLM Orchestrator",
    description="Orquestrador enterprise para múltiplos LLMs com gestão avançada de recursos",
    version=getattr(settings, 'app_version', '2.0.0'),
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Middleware de métricas
metrics_middleware = MetricsMiddleware(app)
app.add_middleware(MetricsMiddleware)

# Middleware CORS
if settings.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Middleware de compressão
app.add_middleware(GZipMiddleware, minimum_size=1000)


# --- Modelos de Dados ---

class GenerationRequest(BaseModel):
    """Modelo para requisições de geração."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "Como implementar autenticação JWT em FastAPI?",
                "context": "technical",
                "user_id": "user123",
                "min_confidence": 0.75
            }
        }
    )
    
    query: str = Field(
        ..., 
        min_length=10, 
        max_length=getattr(settings.orchestrator, 'max_query_length', 2000),
        description="Consulta para os LLMs processarem"
    )
    context: ContextType = Field(
        ContextType.GENERAL,
        description="Contexto da consulta para otimizar respostas"
    )
    user_id: str = Field(
        ..., 
        min_length=1,
        max_length=100,
        description="Identificador único do usuário"
    )
    params: Optional[GenerationParams] = Field(
        None,
        description="Parâmetros específicos de geração"
    )
    min_confidence: float = Field(
        0.65, 
        ge=0.5, 
        le=1.0,
        description="Confiança mínima exigida para a resposta"
    )


class HealthResponse(BaseModel):
    """Modelo para resposta de health check."""
    status: str
    timestamp: float
    version: str
    uptime: Optional[float] = None
    components: Dict[str, str]


class PoolStatsResponse(BaseModel):
    """Modelo para estatísticas do pool."""
    models: Dict[str, Dict[str, Any]]
    global_stats: Dict[str, Any]
    timestamp: float


# --- Funções de Dependência ---

async def get_orchestrator(request: Request) -> LLMOrchestrator:
    """Dependency para obter o orquestrador."""
    orchestrator = getattr(request.app.state, 'orchestrator', None)
    if not orchestrator:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Orquestrador não disponível"
        )
    return orchestrator


async def get_pool(request: Request) -> LLMPool:
    """Dependency para obter o pool."""
    pool = getattr(request.app.state, 'pool', None)
    if not pool:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Pool não disponível"
        )
    return pool


# --- Handlers de Exceção ---

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para erros de validação de request."""
    logger.warning(f"Erro de validação: {exc}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Erro de validação nos dados fornecidos",
            "errors": exc.errors()
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler customizado para HTTPExceptions."""
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "timestamp": time.time(),
            "path": str(request.url.path)
        }
    )


# --- Endpoints da API ---

@app.post(
    "/api/v1/generate", 
    response_model=OrchestratorResponse,
    tags=["LLM Orchestration"],
    summary="Gera resposta consensual usando múltiplos LLMs"
)
async def generate_response(
    payload: GenerationRequest,
    orchestrator: LLMOrchestrator = Depends(get_orchestrator)
) -> JSONResponse:
    """
    Endpoint principal para geração de respostas usando orquestração de LLMs.
    
    Este endpoint:
    - Orquestra múltiplos LLMs para gerar respostas
    - Aplica algoritmos de consenso para garantir qualidade
    - Retorna resposta com métricas de confiança
    - Trata automaticamente failover entre modelos
    """
    try:
        start_time = time.time()
        
        result = await orchestrator.generate(
            query=payload.query,
            context=payload.context.value,
            user_id=payload.user_id,
            params=payload.params,
            min_confidence=payload.min_confidence
        )
        
        # Adiciona métricas de timing
        result.metadata = result.metadata or {}
        result.metadata['processing_time'] = time.time() - start_time
        
        logger.info(
            f"Generation completed | "
            f"user={payload.user_id} | "
            f"confidence={result.confidence:.3f} | "
            f"models={len(result.model_responses)} | "
            f"time={result.metadata['processing_time']:.3f}s"
        )
        
        return JSONResponse(
            content=result.model_dump(),
            status_code=status.HTTP_200_OK
        )

    except InvalidInputError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Entrada inválida: {str(e)}"
        )
    except LLMRateLimitError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Limite de taxa excedido: {str(e)}"
        )
    except (ConsensusError, LLMServiceError) as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Serviço temporariamente indisponível: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Erro inesperado no endpoint /generate: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Monitoring"],
    summary="Verifica saúde da aplicação"
)
async def health_check(request: Request) -> HealthResponse:
    """Health check detalhado da aplicação."""
    components = getattr(request.app.state, 'components', None)
    
    component_status = {
        "session": "ok" if components and components.session else "error",
        "factory": "ok" if components and components.factory else "error",
        "pool": "ok" if components and components.pool else "error",
        "orchestrator": "ok" if components and components.orchestrator else "error"
    }
    
    uptime = None
    if components and components.startup_time:
        uptime = time.time() - components.startup_time
    
    return HealthResponse(
        status="ok" if all(s == "ok" for s in component_status.values()) else "degraded",
        timestamp=time.time(),
        version=getattr(settings, 'app_version', '2.0.0'),
        uptime=uptime,
        components=component_status
    )


@app.get(
    "/pool/stats",
    response_model=PoolStatsResponse,
    tags=["Monitoring"],
    summary="Estatísticas do pool de LLMs"
)
async def get_pool_stats(pool: LLMPool = Depends(get_pool)) -> PoolStatsResponse:
    """Retorna estatísticas detalhadas do pool de LLMs."""
    stats = pool.get_stats()
    
    # Converte PoolStats para dict
    model_stats = {}
    for model_name, stat in stats.items():
        model_stats[model_name] = {
            "total_instances": stat.total_instances,
            "available_instances": stat.available_instances,
            "in_use_instances": stat.in_use_instances,
            "max_size": stat.max_size,
            "utilization_percentage": stat.utilization_percentage,
            "efficiency_percentage": stat.efficiency_percentage,
            "total_acquisitions": stat.total_acquisitions,
            "total_creations": stat.total_creations,
            "total_failures": stat.total_failures,
            "average_acquisition_time": stat.average_acquisition_time,
            "peak_usage": stat.peak_usage
        }
    
    global_stats = {
        "total_models": len(stats),
        "total_instances": pool.size,
        "total_available": pool.available,
        "total_in_use": pool.size - pool.available
    }
    
    return PoolStatsResponse(
        models=model_stats,
        global_stats=global_stats,
        timestamp=time.time()
    )


@app.get(
    "/metrics",
    tags=["Monitoring"],
    summary="Métricas da aplicação"
)
async def get_metrics(request: Request) -> Dict[str, Any]:
    """Retorna métricas coletadas pela aplicação."""
    middleware = None
    
    # Encontra o middleware de métricas
    for middleware_instance in app.user_middleware:
        if isinstance(middleware_instance.cls, type) and issubclass(middleware_instance.cls, MetricsMiddleware):
            # Precisa acessar a instância real, não a classe
            break
    
    base_metrics = {
        "timestamp": time.time(),
        "uptime": time.time() - (app_components.startup_time or time.time()),
        "version": getattr(settings, 'app_version', '2.0.0')
    }
    
    # Adiciona métricas do middleware se disponível
    if hasattr(request.app.state, 'metrics'):
        base_metrics.update(request.app.state.metrics)
    
    return base_metrics


@app.get(
    "/models",
    tags=["Configuration"],
    summary="Lista modelos disponíveis"
)
async def list_models(request: Request) -> Dict[str, Any]:
    """Lista todos os modelos disponíveis na fábrica."""
    factory = getattr(request.app.state, 'factory', None)
    if not factory:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Factory não disponível"
        )
    
    return {
        "available_models": factory.get_available_models(),
        "provider_info": factory.get_provider_info(),
        "timestamp": time.time()
    }


# --- Ponto de Entrada ---

if __name__ == "__main__":
    config = uvicorn.Config(
        app="main:app",
        host=getattr(settings, 'host', '0.0.0.0'),
        port=getattr(settings, 'port', 8000),
        log_level="info",
        reload=settings.debug,
        workers=1 if settings.debug else getattr(settings, 'workers', 1)
    )
    
    server = uvicorn.Server(config)
    
    try:
        logger.info("Iniciando servidor Mozaia LLM Orchestrator...")
        server.run()
    except KeyboardInterrupt:
        logger.info("Servidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {e}", exc_info=True)
        sys.exit(1)
