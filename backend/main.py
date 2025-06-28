import logging
import os
import time
import datetime
import uuid
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, ConfigDict
import structlog
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration

# Importações internas protegidas
try:
    from app.core.llm_orchestrator import LLMOrchestrator
    from app.models.local_llm import OllamaLLM
    from app.models.api_llm import OpenRouterLLM, CohereLLM
    from app.core.config import settings
    from app.core.rate_limiter import RateLimiter
    from app.core.metrics import metrics_middleware
    # ✅ CORREÇÃO: Importar exceções do módulo separado
    from app.core.exceptions import (
        LLMServiceError, 
        OrchestrationError, 
        RateLimitError,
        APIKeyError,
        ServiceUnavailableError
    )
except ImportError as e:
    print(f"❌ Erro ao importar dependências: {e}")
    raise

# --- Configuração de Logging Estruturado ---
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# --- Configuração Sentry para Monitoramento ---
if hasattr(settings, 'SENTRY_DSN') and settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(auto_enable=True),
            AsyncioIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=getattr(settings, 'ENVIRONMENT', 'development'),
        release=getattr(settings, 'VERSION', 'unknown'),
    )
    logger.info("✅ Sentry configurado com sucesso")

# --- Instâncias de Segurança e Utilitários ---
security = HTTPBearer()
rate_limiter = RateLimiter()

# ❌ REMOVIDO: Exceções customizadas movidas para app/core/exceptions.py

# --- Gerenciamento do Ciclo de Vida da Aplicação ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    ✅ CORREÇÃO: Função lifespan completamente implementada
    Gerencia o ciclo de vida da aplicação FastAPI.
    """
    logger.info("🚀 Iniciando Muzaia Legal Assistant API")  # ✅ CORREÇÃO: Nome corrigido
    
    # Inicialização
    try:
        # Inicializar modelos LLM
        ollama_llm = OllamaLLM()
        openrouter_llm = OpenRouterLLM()
        cohere_llm = CohereLLM()
        
        # Inicializar orquestrador
        orchestrator = LLMOrchestrator(
            models=[ollama_llm, openrouter_llm, cohere_llm]
        )
        
        # Armazenar no estado da aplicação
        app.state.orchestrator = orchestrator
        app.state.requests_total = 0
        app.state.avg_response_time = 0
        app.state.active_connections = 0
        app.state.startup_time = datetime.datetime.utcnow()
        
        logger.info("✅ Orquestrador LLM inicializado com sucesso")
        
        yield
        
    except Exception as e:
        logger.error("❌ Erro durante inicialização", error=str(e), exc_info=True)
        raise ServiceUnavailableError(f"Falha na inicialização: {str(e)}")
    finally:
        # ✅ CORREÇÃO: Cleanup implementado
        logger.info("🔄 Encerrando Muzaia Legal Assistant API")
        if hasattr(app.state, 'orchestrator'):
            try:
                await app.state.orchestrator.cleanup()
                logger.info("✅ Cleanup do orquestrador realizado")
            except Exception as e:
                logger.error("❌ Erro durante cleanup", error=str(e))

# --- Criação da Aplicação FastAPI ---
app = FastAPI(
    title="Muzaia Legal Assistant API",  # ✅ CORREÇÃO: Nome corrigido
    description="Plataforma Jurídica Autônoma para Moçambique com IA Multi-Modal",
    version="1.0.0",
    docs_url="/docs" if getattr(settings, 'ENVIRONMENT', 'production') == "development" else None,
    redoc_url="/redoc" if getattr(settings, 'ENVIRONMENT', 'production') == "development" else None,
    openapi_url="/openapi.json",
    lifespan=lifespan  # ✅ CORREÇÃO: Lifespan implementado
)

# --- Middlewares ---
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, 'ALLOWED_ORIGINS', ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host (Segurança)
if hasattr(settings, 'ALLOWED_HOSTS'):
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# ✅ CORREÇÃO: Middleware de métricas
app.add_middleware(metrics_middleware)

# --- Modelos Pydantic ---
class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="A pergunta jurídica para a IA.",
        example="Quais são os requisitos legais para o registro de uma empresa em Moçambique?"
    )
    context: Optional[str] = Field(
        "general",
        description="Contexto legal específico para orientar a resposta da IA.",
        example="direitoempresarial"
    )
    min_confidence: Optional[float] = Field(
        75.0,
        ge=0.0,
        le=100.0,
        description="Pontuação de confiança mínima (0-100) exigida para a resposta da IA.",
        example=85.0
    )
    user_id: Optional[str] = Field(
        None,
        description="Identificador único do usuário que faz a requisição.",
        example="user_12345"
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Identificador único da conversa.",
        example="conv_abcde"
    )
    priority: Optional[str] = Field(
        "normal",
        pattern="^(low|normal|high|urgent)$",
        description="Prioridade da requisição.",
        example="high"
    )

class ChatResponse(BaseModel):
    response: str = Field(..., description="A resposta jurídica gerada pela IA.")
    confidence_score: float = Field(..., ge=0.0, le=100.0, description="Pontuação de confiança (0-100).")
    models_used: List[str] = Field(..., description="Lista dos modelos de IA utilizados.")
    requires_human_review: bool = Field(..., description="Indica se requer revisão humana.")
    sources: List[str] = Field(default_factory=list, description="Lista de fontes legais consultadas.")
    context: str = Field(..., description="O contexto legal aplicado na consulta.")
    conversation_id: Optional[str] = Field(None, description="ID da conversa.")
    response_time_ms: Optional[float] = Field(None, description="Tempo de resposta em milissegundos.")
    disclaimer: str = Field(
        default="Esta resposta é gerada por IA e deve ser verificada por um profissional jurídico qualificado.",
        description="Aviso legal padrão."
    )

class HealthResponse(BaseModel):
    status: str = Field(..., description="Status geral da aplicação.")
    version: str = Field(..., description="Versão atual da API.")
    timestamp: str = Field(..., description="Timestamp da verificação no formato ISO 8601.")
    services: Dict[str, str] = Field(..., description="Status individual dos serviços internos.")

# --- Dependências ---
def get_orchestrator() -> LLMOrchestrator:
    """✅ CORREÇÃO: Validação robusta do orquestrador"""
    if not hasattr(app.state, 'orchestrator'):
        logger.error("❌ Orquestrador não inicializado")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço não está pronto. Tente novamente em alguns instantes."
        )
    return app.state.orchestrator

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """✅ CORREÇÃO: Verificação melhorada da API key"""
    api_key = credentials.credentials
    
    if not hasattr(settings, 'API_KEYS') or not settings.API_KEYS:
        logger.warning("⚠️ Nenhuma API key configurada")
        raise APIKeyError("Configuração de API key não encontrada")
    
    if api_key not in settings.API_KEYS:
        logger.warning("🔐 Tentativa de acesso com API key inválida", api_key_prefix=api_key[:8])
        raise APIKeyError("API key inválida")
    
    return api_key

async def check_rate_limit(request: Request):
    """✅ CORREÇÃO: Rate limiting implementado"""
    try:
        await rate_limiter.check_rate_limit(
            key=request.client.host,
            limit=100,  # 100 requests
            window=3600  # por hora
        )
    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Limite de taxa excedido. Tente novamente mais tarde."}
        )

# --- Middleware de Request ID ---
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """✅ CORREÇÃO: Middleware de request tracking"""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    with structlog.contextvars.bound_contextvars(request_id=request_id):
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

# --- Endpoints ---
@app.get("/", response_model=Dict[str, Any], summary="Informações da API")
async def root():
    """Retorna informações básicas sobre a API Muzaia Legal Assistant."""  # ✅ CORREÇÃO: Nome corrigido
    return {
        "message": "Muzaia Legal Assistant API",  # ✅ CORREÇÃO: Nome corrigido
        "version": "1.0.0",
        "status": "active",
        "description": "Plataforma Jurídica Autônoma para Moçambique com IA Multi-Modal.",
        "docs_url": "/docs" if getattr(settings, 'ENVIRONMENT', 'production') == "development" else "Disponível apenas em ambiente de desenvolvimento."
    }

@app.get("/health", response_model=HealthResponse, summary="Verificação de Saúde da Aplicação")
async def health_check():
    """✅ CORREÇÃO: Health check melhorado"""
    services_status = {}
    
    # Verificar orquestrador
    try:
        if hasattr(app.state, 'orchestrator') and app.state.orchestrator:
            services_status["orchestrator"] = "healthy"
        else:
            services_status["orchestrator"] = "unhealthy"
    except Exception:
        services_status["orchestrator"] = "unhealthy"
    
    # Status geral
    overall_status = "healthy" if all(status == "healthy" for status in services_status.values()) else "degraded"
    
    return HealthResponse(
        status=overall_status,
        version="1.0.0",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        services=services_status
    )

@app.post("/chat", response_model=ChatResponse, summary="Consulta Jurídica com IA")
async def legal_chat(
    request: ChatRequest,
    orchestrator: LLMOrchestrator = Depends(get_orchestrator),
    api_key: str = Depends(verify_api_key),
    _: None = Depends(check_rate_limit)
):
    """✅ CORREÇÃO: Endpoint melhorado com tratamento robusto"""
    start_time = time.time()
    
    logger.info(
        "📝 Nova consulta jurídica recebida",
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        query_length=len(request.message)
    )
    
    try:
        # Processar consulta
        result = await orchestrator.get_legal_response(
            query=request.message,
            context=request.context,
            min_confidence=request.min_confidence,
            user_id=request.user_id,
            conversation_id=request.conversation_id
        )
        
        response_time_ms = (time.time() - start_time) * 1000
        
        # ✅ CORREÇÃO: Incrementar métricas
        if hasattr(app.state, 'requests_total'):
            app.state.requests_total += 1
        
        logger.info(
            "✅ Consulta processada com sucesso",
            user_id=request.user_id,
            confidence_score=result.get("confidence_score", 0),
            response_time_ms=response_time_ms,
            models_used=result.get("models_used", [])
        )
        
        return ChatResponse(
            response=result.get("text", ""),
            confidence_score=result.get("confidence_score", 0),
            models_used=result.get("models_used", []),
            requires_human_review=result.get("requires_human_review", False),
            sources=result.get("sources", []),
            context=result.get("context", request.context),
            conversation_id=result.get("conversation_id"),
            response_time_ms=response_time_ms
        )
        
    except (LLMServiceError, OrchestrationError) as e:
        logger.error(
            "❌ Erro específico no orquestrador/LLM",
            error=str(e),
            code=getattr(e, 'code', 'UNKNOWN'),
            user_id=request.user_id,
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar consulta jurídica: {e.message}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "❌ Erro inesperado durante consulta jurídica",
            error=str(e),
            user_id=request.user_id,
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar sua solicitação. Tente novamente mais tarde."
        )

@app.get("/metrics", summary="Métricas de Desempenho da API")
async def metrics(api_key: str = Depends(verify_api_key)):
    """✅ CORREÇÃO: Métricas melhoradas"""
    return {
        "requests_total": getattr(app.state, "requests_total", 0),
        "average_response_time_ms": getattr(app.state, "avg_response_time", 0),
        "active_connections": getattr(app.state, "active_connections", 0),
        "uptime_seconds": (datetime.datetime.utcnow() - getattr(app.state, "startup_time", datetime.datetime.utcnow())).total_seconds(),
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# --- Execução da Aplicação ---
if __name__ == "__main__":
    import uvicorn
    
    # ✅ CORREÇÃO: Configuração melhorada do uvicorn
    uvicorn_config = {
        "app": "main:app",
        "host": "0.0.0.0",
        "port": 8000,
        "reload": getattr(settings, 'ENVIRONMENT', 'production') == "development",
        "workers": 1 if getattr(settings, 'ENVIRONMENT', 'production') == "development" else (os.cpu_count() or 1) * 2,
        "log_config": None,  # ✅ CORREÇÃO: Usar structlog
        "access_log": False,  # ✅ CORREÇÃO: Desabilitar logs de acesso padrão
    }
    
    logger.info("🚀 Iniciando servidor Muzaia", config=uvicorn_config)  # ✅ CORREÇÃO: Nome corrigido
    uvicorn.run(**uvicorn_config)
