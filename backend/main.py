# -*- coding: utf-8 -*-
"""
Ponto de Entrada Principal da Aplicação Mozaia LLM Orchestrator.

API FastAPI enterprise-grade com observabilidade completa,
resiliência, monitoramento e gestão robusta de recursos.
"""
from __future__ import annotations

import asyncio
import logging
import sys
import time
import traceback
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List

import aiohttp
import uvicorn
from fastapi import FastAPI, Request, HTTPException, status, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, ConfigDict
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.orchestrator import LLMOrchestrator
from app.schemas import (
    GenerationParams, OrchestratorResponse, ContextType,
    HealthStatus, SystemMetrics, ModelStatus
)
from app.core.exceptions import (
    InvalidInputError, LLMRateLimitError, ConsensusError,
    LLMServiceError, LLMError, MozaiaError
)
from app.core.factory import LLMFactory
from app.core.pool import LLMPool, PoolConfig

# Configuração avançada de logging
def setup_logging():
    """Configura sistema de logging estruturado."""
    log_level = logging.DEBUG if settings.debug else logging.INFO
    
    log_format = (
        "%(asctime)s | %(name)s | %(levelname)s | "
        "%(funcName)s:%(lineno)d | %(message)s"
    )
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(log_format))
    
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    
    # Configurar loggers específicos
    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    
    return logging.getLogger(__name__)

logger = setup_logging()


# --- Middleware de Observabilidade ---

class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware avançado para observabilidade e métricas."""
    
    def __init__(self, app):
        super().__init__(app)
        self.metrics = {
            "requests": {
                "total": 0,
                "successful": 0,
                "failed": 0,
                "by_endpoint": {},
                "by_status_code": {},
                "by_method": {}
            },
            "response_times": {
                "total_time": 0.0,
                "count": 0,
                "percentiles": {"p50": 0.0, "p95": 0.0, "p99": 0.0},
                "recent_times": []
            },
            "errors": {
                "total": 0,
                "by_type": {},
                "recent_errors": []
            },
            "active_requests": 0,
            "peak_concurrent_requests": 0
        }

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = f"req_{int(start_time * 1000)}"
        
        # Incrementar requests ativos
        self.metrics["active_requests"] += 1
        if self.metrics["active_requests"] > self.metrics["peak_concurrent_requests"]:
            self.metrics["peak_concurrent_requests"] = self.metrics["active_requests"]
        
        # Atualizar contadores
        self.metrics["requests"]["total"] += 1
        self.metrics["requests"]["by_method"][request.method] = (
            self.metrics["requests"]["by_method"].get(request.method, 0) + 1
        )
        
        try:
            # Adicionar headers de tracking
            request.state.request_id = request_id
            request.state.start_time = start_time
            
            response = await call_next(request)
            
            # Calcular tempo de resposta
            duration = time.time() - start_time
            
            # Atualizar métricas de sucesso
            self.metrics["requests"]["successful"] += 1
            self._update_response_time_metrics(duration)
            self._update_endpoint_metrics(request.url.path, True)
            self._update_status_code_metrics(response.status_code)
            
            # Adicionar headers de resposta
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{duration:.3f}"
            response.headers["X-Timestamp"] = str(start_time)
            
            # Log de sucesso
            logger.info(
                f"Request completed | "
                f"id={request_id} | "
                f"method={request.method} | "
                f"path={request.url.path} | "
                f"status={response.status_code} | "
                f"duration={duration:.3f}s | "
                f"user_agent={request.headers.get('User-Agent', 'unknown')[:50]}"
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            # Atualizar métricas de erro
            self.metrics["requests"]["failed"] += 1
            self.metrics["errors"]["total"] += 1
            
            error_type = type(e).__name__
            self.metrics["errors"]["by_type"][error_type] = (
                self.metrics["errors"]["by_type"].get(error_type, 0) + 1
            )
            
            # Armazenar erro recente
            self.metrics["errors"]["recent_errors"].append({
                "timestamp": time.time(),
                "type": error_type,
                "message": str(e),
                "path": request.url.path,
                "method": request.method
            })
            
            # Manter apenas os últimos 100 erros
            if len(self.metrics["errors"]["recent_errors"]) > 100:
                self.metrics["errors"]["recent_errors"].pop(0)
            
            self._update_response_time_metrics(duration)
            self._update_endpoint_metrics(request.url.path, False)
            
            # Log de erro
            logger.error(
                f"Request failed | "
                f"id={request_id} | "
                f"method={request.method} | "
                f"path={request.url.path} | "
                f"error={error_type}: {str(e)} | "
                f"duration={duration:.3f}s"
            )
            
            raise
        finally:
            # Decrementar requests ativos
            self.metrics["active_requests"] -= 1

    def _update_response_time_metrics(self, duration: float):
        """Atualiza métricas de tempo de resposta."""
        self.metrics["response_times"]["total_time"] += duration
        self.metrics["response_times"]["count"] += 1
        
        # Adicionar à lista de tempos recentes
        recent_times = self.metrics["response_times"]["recent_times"]
        recent_times.append(duration)
        
        # Manter apenas os últimos 1000 tempos
        if len(recent_times) > 1000:
            recent_times.pop(0)
        
        # Calcular percentis
        if recent_times:
            sorted_times = sorted(recent_times)
            n = len(sorted_times)
            
            self.metrics["response_times"]["percentiles"]["p50"] = sorted_times[int(n * 0.5)]
            self.metrics["response_times"]["percentiles"]["p95"] = sorted_times[int(n * 0.95)]
            self.metrics["response_times"]["percentiles"]["p99"] = sorted_times[int(n * 0.99)]

    def _update_endpoint_metrics(self, path: str, success: bool):
        """Atualiza métricas por endpoint."""
        if path not in self.metrics["requests"]["by_endpoint"]:
            self.metrics["requests"]["by_endpoint"][path] = {
                "total": 0, "successful": 0, "failed": 0
            }
        
        endpoint_metrics = self.metrics["requests"]["by_endpoint"][path]
        endpoint_metrics["total"] += 1
        
        if success:
            endpoint_metrics["successful"] += 1
        else:
            endpoint_metrics["failed"] += 1

    def _update_status_code_metrics(self, status_code: int):
        """Atualiza métricas por código de status."""
        self.metrics["requests"]["by_status_code"][str(status_code)] = (
            self.metrics["requests"]["by_status_code"].get(str(status_code), 0) + 1
        )

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Retorna resumo das métricas coletadas."""
        total_requests = self.metrics["requests"]["total"]
        total_time = self.metrics["response_times"]["total_time"]
        
        return {
            "requests": {
                **self.metrics["requests"],
                "success_rate": (
                    self.metrics["requests"]["successful"] / max(total_requests, 1) * 100
                ),
                "error_rate": (
                    self.metrics["requests"]["failed"] / max(total_requests, 1) * 100
                )
            },
            "response_times": {
                **self.metrics["response_times"],
                "average": total_time / max(self.metrics["response_times"]["count"], 1)
            },
            "errors": self.metrics["errors"],
            "concurrent": {
                "active_requests": self.metrics["active_requests"],
                "peak_concurrent_requests": self.metrics["peak_concurrent_requests"]
            }
        }


# --- Gestão do Ciclo de Vida da Aplicação ---

class AppComponents:
    """Container para todos os componentes da aplicação."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.factory: Optional[LLMFactory] = None
        self.pool: Optional[LLMPool] = None
        self.orchestrator: Optional[LLMOrchestrator] = None
        self.observability_middleware: Optional[ObservabilityMiddleware] = None
        self.startup_time: Optional[float] = None
        self.initialization_errors: List[str] = []

    async def initialize(self) -> None:
        """Inicializa todos os componentes da aplicação."""
        try:
            startup_start = time.time()
            logger.info("🚀 Iniciando inicialização da aplicação Mozaia...")
            
            # 1. Validação de configurações críticas
            await self._validate_configuration()
            
            # 2. Criar sessão HTTP otimizada
            await self._create_http_session()
            
            # 3. Criar e configurar fábrica de LLMs
            await self._create_factory()
            
            # 4. Criar e configurar pool de LLMs
            await self._create_pool()
            
            # 5. Preload de modelos críticos
            await self._preload_critical_models()
            
            # 6. Criar e inicializar orquestrador
            await self._create_orchestrator()
            
            # 7. Validação final de componentes
            await self._validate_components()
            
            self.startup_time = time.time() - startup_start
            logger.info(
                f"✅ Aplicação Mozaia inicializada com sucesso em {self.startup_time:.2f}s"
            )
            
        except Exception as e:
            error_msg = f"❌ Falha crítica na inicialização: {str(e)}"
            self.initialization_errors.append(error_msg)
            logger.error(error_msg, exc_info=True)
            await self.cleanup()
            raise

    async def _validate_configuration(self) -> None:
        """Valida configurações essenciais."""
        logger.info("🔍 Validando configurações...")
        
        required_settings = [
            ('models.ollama_llama_model', settings.models.ollama_llama_model),
            ('models.ollama_gemma_model', settings.models.ollama_gemma_model),
            ('models.openrouter_qwen_model', settings.models.openrouter_qwen_model),
        ]
        
        for setting_name, value in required_settings:
            if not value:
                raise ValueError(f"Configuração obrigatória ausente: {setting_name}")
        
        # Validar URLs
        if not settings.models.ollama_base_url.startswith(('http://', 'https://')):
            raise ValueError("ollama_base_url deve ser uma URL válida")
        
        logger.info("✅ Configurações validadas")

    async def _create_http_session(self) -> None:
        """Cria sessão HTTP otimizada."""
        logger.info("🌐 Criando sessão HTTP...")
        
        connector = aiohttp.TCPConnector(
            limit=settings.http.max_connections,
            limit_per_host=settings.http.max_connections_per_host,
            ttl_dns_cache=300,
            use_dns_cache=True,
            keepalive_timeout=30,
            enable_cleanup_closed=True,
            force_close=True,
            ssl=False  # Para desenvolvimento local
        )
        
        timeout = aiohttp.ClientTimeout(
            total=settings.http.total_timeout,
            connect=settings.http.connect_timeout
        )
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                "User-Agent": f"Mozaia-LLM-Orchestrator/{settings.app_version}",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate"
            }
        )
        
        logger.info("✅ Sessão HTTP criada")

    async def _create_factory(self) -> None:
        """Cria e configura fábrica de LLMs."""
        logger.info("🏭 Criando fábrica de LLMs...")
        
        self.factory = LLMFactory(self.session)
        available_models = self.factory.get_available_models()
        
        logger.info(f"✅ Fábrica criada com {len(available_models)} modelos disponíveis")
        logger.debug(f"Modelos: {available_models}")

    async def _create_pool(self) -> None:
        """Cria e configura pool de LLMs."""
        logger.info("🏊 Criando pool de LLMs...")
        
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
        logger.info("✅ Pool de LLMs criado")

    async def _preload_critical_models(self) -> None:
        """Pré-carrega modelos críticos."""
        logger.info("⏳ Pré-carregando modelos críticos...")
        
        critical_models = [
            settings.models.ollama_llama_model,
            settings.models.openrouter_qwen_model
        ]
        
        preload_tasks = []
        for model in critical_models:
            if await self.pool.validate_model(model):
                task = self.pool.preload_model(model, count=2)
                preload_tasks.append(task)
            else:
                logger.warning(f"Modelo {model} não está disponível para preload")
        
        if preload_tasks:
            try:
                results = await asyncio.gather(*preload_tasks, return_exceptions=True)
                total_preloaded = sum(r for r in results if isinstance(r, int))
                logger.info(f"✅ Pré-carregadas {total_preloaded} instâncias de modelos críticos")
            except Exception as e:
                logger.warning(f"Erro no preload: {e}")

    async def _create_orchestrator(self) -> None:
        """Cria e inicializa orquestrador."""
        logger.info("🎼 Criando orquestrador...")
        
        self.orchestrator = LLMOrchestrator(self.pool)
        await self.orchestrator.initialize()
        
        logger.info("✅ Orquestrador inicializado")

    async def _validate_components(self) -> None:
        """Validação final dos componentes."""
        logger.info("🔍 Validando componentes finais...")
        
        # Teste básico do orquestrador
        try:
            health_status = await self.orchestrator.health_check()
            if health_status.get("status") != "healthy":
                logger.warning("Orquestrador não está completamente saudável")
        except Exception as e:
            logger.error(f"Erro na validação do orquestrador: {e}")
        
        logger.info("✅ Validação de componentes concluída")

    async def cleanup(self) -> None:
        """Limpa todos os recursos."""
        logger.info("🧹 Iniciando limpeza de recursos...")
        
        cleanup_tasks = []
        
        if self.pool:
            cleanup_tasks.append(self.pool.close_all())
        
        if self.session:
            cleanup_tasks.append(self.session.close())
        
        if cleanup_tasks:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*cleanup_tasks, return_exceptions=True),
                    timeout=30.0
                )
            except asyncio.TimeoutError:
                logger.warning("Timeout na limpeza de recursos")
        
        logger.info("✅ Limpeza de recursos concluída")

    def get_status(self) -> Dict[str, Any]:
        """Retorna status detalhado dos componentes."""
        return {
            "session": "ok" if self.session and not self.session.closed else "error",
            "factory": "ok" if self.factory else "error",
            "pool": "ok" if self.pool else "error",
            "orchestrator": "ok" if self.orchestrator else "error",
            "startup_time": self.startup_time,
            "initialization_errors": self.initialization_errors
        }


# Instância global dos componentes
app_components = AppComponents()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida completo da aplicação."""
    try:
        # Inicialização
        await app_components.initialize()
        
        # Adicionar componentes ao estado da aplicação
        app.state.orchestrator = app_components.orchestrator
        app.state.pool = app_components.pool
        app.state.factory = app_components.factory
        app.state.components = app_components
        
        logger.info("🎉 Aplicação Mozaia pronta para receber requisições!")
        
        yield
        
    except Exception as e:
        logger.error(f"💥 Erro crítico no lifespan: {e}", exc_info=True)
        raise
    finally:
        # Cleanup
        await app_components.cleanup()
        logger.info("👋 Aplicação Mozaia finalizada")


# --- Configuração da Aplicação FastAPI ---

app = FastAPI(
    title="Mozaia LLM Orchestrator",
    description="Orquestrador enterprise para múltiplos LLMs com gestão avançada de recursos",
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
    responses={
        500: {"description": "Erro interno do servidor"},
        503: {"description": "Serviço temporariamente indisponível"},
        429: {"description": "Muitas requisições"}
    }
)

# Middleware de observabilidade
observability_middleware = ObservabilityMiddleware(app)
app.add_middleware(ObservabilityMiddleware)

# Middleware CORS
if settings.debug or settings.environment == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time"]
    )

# Middleware de compressão
app.add_middleware(GZipMiddleware, minimum_size=1000)


# --- Modelos de Dados da API ---

class GenerationRequest(BaseModel):
    """Modelo para requisições de geração."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "Como implementar autenticação JWT em FastAPI?",
                "context": "technical",
                "user_id": "user123",
                "min_confidence": 0.75,
                "params": {
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            }
        }
    )
    
    query: str = Field(
        ..., 
        min_length=10, 
        max_length=settings.orchestrator.max_query_length,
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
    enable_streaming: bool = Field(
        False,
        description="Habilitar resposta em streaming"
    )


class StreamGenerationRequest(BaseModel):
    """Modelo para requisições de streaming."""
    query: str = Field(..., min_length=10, max_length=2000)
    context: ContextType = ContextType.GENERAL
    user_id: str = Field(..., min_length=1, max_length=100)
    params: Optional[GenerationParams] = None


class HealthResponse(BaseModel):
    """Modelo para resposta de health check."""
    status: str
    timestamp: float
    version: str
    uptime: Optional[float] = None
    components: Dict[str, str]
    models_available: List[str]
    pool_summary: Dict[str, Any]


class MetricsResponse(BaseModel):
    """Modelo para resposta de métricas."""
    timestamp: float
    uptime: float
    version: str
    orchestrator_metrics: Dict[str, Any]
    pool_metrics: Dict[str, Any]
    factory_metrics: Dict[str, Any]
    http_metrics: Dict[str, Any]


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


async def get_factory(request: Request) -> LLMFactory:
    """Dependency para obter a factory."""
    factory = getattr(request.app.state, 'factory', None)
    if not factory:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Factory não disponível"
        )
    return factory


def get_request_id(request: Request) -> str:
    """Obtém ID da requisição."""
    return getattr(request.state, 'request_id', 'unknown')


# --- Handlers de Exceção ---

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para erros de validação."""
    request_id = get_request_id(request)
    
    logger.warning(f"Erro de validação [ID: {request_id}]: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "message": "Dados de entrada inválidos",
            "details": exc.errors(),
            "request_id": request_id,
            "timestamp": time.time()
        }
    )


@app.exception_handler(MozaiaError)
async def mozaia_exception_handler(request: Request, exc: MozaiaError):
    """Handler para exceções customizadas da aplicação."""
    request_id = get_request_id(request)
    
    # Mapear tipos de erro para códigos HTTP
    status_code_map = {
        "INVALID_INPUT_ERROR": status.HTTP_400_BAD_REQUEST,
        "LLM_RATE_LIMIT_ERROR": status.HTTP_429_TOO_MANY_REQUESTS,
        "CONSENSUS_ERROR": status.HTTP_503_SERVICE_UNAVAILABLE,
        "LLM_SERVICE_ERROR": status.HTTP_503_SERVICE_UNAVAILABLE,
        "LLM_CONNECTION_ERROR": status.HTTP_503_SERVICE_UNAVAILABLE,
        "AUTHENTICATION_ERROR": status.HTTP_401_UNAUTHORIZED,
        "AUTHORIZATION_ERROR": status.HTTP_403_FORBIDDEN
    }
    
    status_code = status_code_map.get(exc.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    logger.error(f"Erro Mozaia [ID: {request_id}]: {exc.error_code} - {exc.message}")
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.error_code.lower(),
            "message": exc.message,
            "request_id": request_id,
            "timestamp": time.time(),
            "retryable": status_code in [503, 429, 502, 504]
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler para HTTPExceptions."""
    request_id = get_request_id(request)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": exc.detail,
            "status_code": exc.status_code,
            "request_id": request_id,
            "timestamp": time.time()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler para exceções não tratadas."""
    request_id = get_request_id(request)
    
    logger.error(
        f"Erro não tratado [ID: {request_id}]: {type(exc).__name__}: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_error",
            "message": "Erro interno do servidor",
            "request_id": request_id,
            "timestamp": time.time()
        }
    )


# --- Endpoints da API ---

@app.get("/", tags=["Root"])
async def root():
    """Endpoint raiz com informações básicas."""
    return {
        "name": "Mozaia LLM Orchestrator",
        "version": settings.app_version,
        "status": "operational",
        "timestamp": time.time(),
        "docs_url": "/docs" if settings.debug else None,
        "health_check": "/health"
    }


@app.post(
    "/api/v1/generate", 
    response_model=OrchestratorResponse,
    tags=["LLM Orchestration"],
    summary="Gera resposta consensual usando múltiplos LLMs",
    description="""
    Endpoint principal para geração de respostas usando orquestração de LLMs.
    
    Este endpoint:
    - Orquestra múltiplos LLMs para gerar respostas
    - Aplica algoritmos de consenso para garantir qualidade
    - Retorna resposta com métricas de confiança
    - Trata automaticamente failover entre modelos
    - Suporte a diferentes contextos (legal, técnico, etc.)
    """
)
async def generate_response(
    request: GenerationRequest,
    background_tasks: BackgroundTasks,
    orchestrator: LLMOrchestrator = Depends(get_orchestrator)
) -> OrchestratorResponse:
    """Gera resposta orquestrada usando múltiplos LLMs."""
    
    start_time = time.time()
    
    try:
        result = await orchestrator.generate(
            query=request.query,
            context=request.context.value,
            user_id=request.user_id,
            params=request.params,
            min_confidence=request.min_confidence
        )
        
        # Adicionar métricas de timing
        result.metadata = result.metadata or {}
        result.metadata['api_processing_time'] = time.time() - start_time
        result.metadata['endpoint'] = '/api/v1/generate'
        
        # Task em background para logging/analytics
        background_tasks.add_task(
            log_generation_analytics,
            request.user_id,
            request.context.value,
            result.confidence,
            len(result.model_responses),
            time.time() - start_time
        )
        
        logger.info(
            f"Generation successful | "
            f"user={request.user_id} | "
            f"context={request.context.value} | "
            f"confidence={result.confidence:.3f} | "
            f"models={len(result.model_responses)} | "
            f"time={result.metadata['api_processing_time']:.3f}s"
        )
        
        return result
        
    except Exception as e:
        # Log detalhado do erro
        logger.error(
            f"Generation failed | "
            f"user={request.user_id} | "
            f"context={request.context.value} | "
            f"query_length={len(request.query)} | "
            f"error={type(e).__name__}: {str(e)}"
        )
        raise


@app.post(
    "/api/v1/stream",
    tags=["LLM Orchestration"],
    summary="Gera resposta em streaming"
)
async def stream_generate(
    request: StreamGenerationRequest,
    orchestrator: LLMOrchestrator = Depends(get_orchestrator)
):
    """Gera resposta em streaming usando o melhor modelo disponível."""
    
    async def generate_stream():
        try:
            async for chunk in orchestrator.stream_generate(
                query=request.query,
                context=request.context.value,
                user_id=request.user_id,
                params=request.params
            ):
                # Formato Server-Sent Events
                data = f"data: {chunk}\n\n"
                yield data.encode('utf-8')
                
                if chunk.get('is_final', False):
                    break
                    
        except Exception as e:
            error_chunk = {
                "error": True,
                "message": str(e),
                "is_final": True
            }
            yield f"data: {error_chunk}\n\n".encode('utf-8')
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Monitoring"],
    summary="Health check detalhado da aplicação"
)
async def health_check(request: Request) -> HealthResponse:
    """Health check abrangente da aplicação e componentes."""
    
    components = getattr(request.app.state, 'components', None)
    component_status = {}
    models_available = []
    pool_summary = {}
    
    if components:
        component_status = components.get_status()
        
        # Obter modelos disponíveis
        if components.factory:
            try:
                models_available = components.factory.get_available_models()
            except Exception:
                pass
        
        # Resumo do pool
        if components.pool:
            try:
                stats = components.pool.get_stats()
                pool_summary = {
                    "total_models": len(stats),
                    "total_instances": components.pool.size,
                    "available_instances": components.pool.available
                }
            except Exception:
                pass
    
    # Determinar status geral
    overall_status = "healthy"
    if component_status:
        if any(status == "error" for status in component_status.values()):
            overall_status = "unhealthy"
        elif component_status.get("initialization_errors"):
            overall_status = "degraded"
    
    uptime = None
    if component_status.get("startup_time"):
        uptime = time.time() - (
            time.time() - component_status["startup_time"]
        )
    
    return HealthResponse(
        status=overall_status,
        timestamp=time.time(),
        version=settings.app_version,
        uptime=uptime,
        components=component_status,
        models_available=models_available[:10],  # Limite para response size
        pool_summary=pool_summary
    )


@app.get(
    "/metrics",
    response_model=MetricsResponse,
    tags=["Monitoring"],
    summary="Métricas detalhadas da aplicação"
)
async def get_metrics(
    request: Request,
    orchestrator: LLMOrchestrator = Depends(get_orchestrator),
    pool: LLMPool = Depends(get_pool),
    factory: LLMFactory = Depends(get_factory)
) -> MetricsResponse:
    """Retorna métricas detalhadas de todos os componentes."""
    
    uptime = time.time() - app_components.startup_time if app_components.startup_time else 0
    
    return MetricsResponse(
        timestamp=time.time(),
        uptime=uptime,
        version=settings.app_version,
        orchestrator_metrics=orchestrator.get_metrics(),
        pool_metrics=pool.get_global_metrics(),
        factory_metrics=factory.get_metrics(),
        http_metrics=observability_middleware.get_metrics_summary()
    )


@app.get(
    "/pool/stats",
    tags=["Monitoring"],
    summary="Estatísticas detalhadas do pool"
)
async def get_pool_stats(pool: LLMPool = Depends(get_pool)):
    """Retorna estatísticas detalhadas do pool de LLMs."""
    
    stats = pool.get_stats()
    global_metrics = pool.get_global_metrics()
    
    # Converter PoolStats para dict
    model_stats = {}
    for model_name, stat in stats.items():
        model_stats[model_name] = {
            "model_name": stat.model_name,
            "total_instances": stat.total_instances,
            "available_instances": stat.available_instances,
            "in_use_instances": stat.in_use_instances,
            "max_size": stat.max_size,
            "min_size": stat.min_size,
            "utilization_percentage": stat.utilization_percentage,
            "efficiency_percentage": stat.efficiency_percentage,
            "total_acquisitions": stat.total_acquisitions,
            "total_creations": stat.total_creations,
            "total_failures": stat.total_failures,
            "average_acquisition_time": stat.average_acquisition_time,
            "peak_usage": stat.peak_usage,
            "health_check_success_rate": stat.health_check_success_rate,
            "warmup_completed": stat.warmup_completed
        }
    
    return {
        "timestamp": time.time(),
        "global_metrics": global_metrics,
        "model_stats": model_stats
    }


@app.get(
    "/models",
    tags=["Configuration"],
    summary="Lista modelos disponíveis"
)
async def list_models(factory: LLMFactory = Depends(get_factory)):
    """Lista todos os modelos disponíveis na fábrica."""
    
    return {
        "timestamp": time.time(),
        "available_models": factory.get_available_models(),
        "provider_info": factory.get_provider_info(),
        "factory_metrics": factory.get_metrics()
    }


@app.post(
    "/admin/cache/clear",
    tags=["Administration"],
    summary="Limpa cache do orquestrador"
)
async def clear_cache(orchestrator: LLMOrchestrator = Depends(get_orchestrator)):
    """Limpa cache de respostas do orquestrador."""
    
    await orchestrator.clear_cache()
    
    return {
        "message": "Cache limpo com sucesso",
        "timestamp": time.time()
    }


@app.post(
    "/admin/pool/{model_name}/preload",
    tags=["Administration"],
    summary="Pré-carrega instâncias de um modelo"
)
async def preload_model(
    model_name: str,
    count: int = 2,
    pool: LLMPool = Depends(get_pool)
):
    """Pré-carrega instâncias de um modelo específico."""
    
    if count < 1 or count > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Count deve estar entre 1 e 10"
        )
    
    created = await pool.preload_model(model_name, count)
    
    return {
        "model_name": model_name,
        "requested": count,
        "created": created,
        "timestamp": time.time()
    }


# --- Funções Auxiliares ---

async def log_generation_analytics(
    user_id: str,
    context: str,
    confidence: float,
    models_used: int,
    processing_time: float
):
    """Registra analytics de geração em background."""
    try:
        # Aqui você pode integrar com sistemas de analytics
        # como ElasticSearch, InfluxDB, ou banco de dados
        logger.info(
            f"Analytics | user={user_id} | context={context} | "
            f"confidence={confidence:.3f} | models={models_used} | "
            f"time={processing_time:.3f}s"
        )
    except Exception as e:
        logger.error(f"Erro ao registrar analytics: {e}")


# --- Ponto de Entrada ---

if __name__ == "__main__":
    config = uvicorn.Config(
        app="main:app",
        host=settings.host,
        port=settings.port,
        log_level="info",
        reload=settings.debug,
        workers=1,  # Sempre 1 worker devido ao estado compartilhado
        access_log=True,
        use_colors=True
    )
    
    server = uvicorn.Server(config)
    
    try:
        logger.info(f"🚀 Iniciando servidor Mozaia LLM Orchestrator em {settings.host}:{settings.port}")
        server.run()
    except KeyboardInterrupt:
        logger.info("🛑 Servidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"💥 Erro ao iniciar servidor: {e}", exc_info=True)
        sys.exit(1)
