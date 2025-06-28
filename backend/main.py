import logging
import os
import time
import datetime
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

# Assumindo que estas importações estão disponíveis no seu projeto
from app.core.llm_orchestrator import LLMOrchestrator
from app.models.local_llm import OllamaLLM
from app.models.api_llm import OpenRouterLLM, CohereLLM
from app.core.consensus_engine import ConsensusEngine # Importado mas não usado no main.py, assumindo uso interno do orchestrator
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.core.metrics import metrics_middleware

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
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(auto_enable=True),
            AsyncioIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
    )

# --- Instâncias de Segurança e Utilitários ---
security = HTTPBearer()
rate_limiter = RateLimiter()

# --- Definição de Exceções Customizadas (Exemplo) ---
# Adicione este arquivo (e a classe) em app/core/exceptions.py
class LLMServiceError(Exception):
    def __init__(self, message: str = "Erro no serviço LLM", code: str = "LLM_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)

class OrchestrationError(Exception):
    def __init__(self, message: str = "Erro de orquestração", code: str = "ORCHESTRATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)

# --- Gerenciamento do Ciclo de Vida da Aplicação ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação FastAPI.
    Inicializa o LLMOrchestrator no startup e o encerra no shutdown.
    """
    logger.info("Iniciando Mozaia Legal Assistant API")

    try:
        # Armazenar a instância do orquestrador no estado da aplicação
        app.state.orchestrator = LLMOrchestrator()
        await app.state.orchestrator.initialize()

        logger.info("API iniciada com sucesso e orquestrador inicializado.")
        yield # A aplicação fica ativa aqui

    except Exception as e:
        logger.error("Erro fatal ao inicializar a API", error=str(e), exc_info=True)
        # Sentry captura automaticamente se configurado
        raise # Re-levanta a exceção para que a aplicação falhe na inicialização
    finally:
        # Cleanup do orquestrador no shutdown
        if hasattr(app.state, 'orchestrator') and app.state.orchestrator:
            await app.state.orchestrator.cleanup()
        logger.info("API finalizada e recursos do orquestrador liberados.")

# --- Criação da Aplicação FastAPI ---
app = FastAPI(
    title="Mozaia Legal Assistant API",
    description="Plataforma Jurídica Autônoma para Moçambique com IA Multi-Modal",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan # Conecta o gerenciador de ciclo de vida
)

# --- Middlewares ---
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.middleware("http")(metrics_middleware) # Middleware personalizado de métricas

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
        description="Contexto legal específico para orientar a resposta da IA (ex: 'direitocivil', 'direitoempresarial').",
        example="direitoempresarial"
    )
    min_confidence: Optional[float] = Field(
        75.0,
        ge=0.0,
        le=100.0,
        description="Pontuação de confiança mínima (0-100) exigida para a resposta da IA. Se a confiança for menor, pode indicar revisão humana.",
        example=85.0
    )
    user_id: Optional[str] = Field(
        None,
        description="Identificador único do usuário que faz a requisição, para rastreamento e personalização.",
        example="user_12345"
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Identificador único da conversa, para manter o contexto em interações subsequentes.",
        example="conv_abcde"
    )
    priority: Optional[str] = Field(
        "normal",
        pattern="^(low|normal|high|urgent)$",
        description="Prioridade da requisição para processamento. Valores permitidos: 'low', 'normal', 'high', 'urgent'.",
        example="high"
    )

class ChatResponse(BaseModel):
    response: str = Field(..., description="A resposta jurídica gerada pela IA.")
    confidence_score: float = Field(..., ge=0.0, le=100.0, description="Pontuação de confiança (0-100) da resposta da IA.")
    models_used: List[str] = Field(..., description="Lista dos modelos de IA utilizados para gerar a resposta.")
    requires_human_review: bool = Field(..., description="Indica se a resposta requer revisão por um profissional jurídico humano devido à baixa confiança ou complexidade.")
    sources: List[str] = Field(default_factory=list, description="Lista de fontes legais (ex: artigos de lei, precedentes) consultadas para formular a resposta.")
    context: str = Field(..., description="O contexto legal que foi aplicado na consulta.")
    conversation_id: Optional[str] = Field(None, description="O ID da conversa ao qual esta resposta pertence.")
    response_time_ms: Optional[float] = Field(None, description="Tempo total de resposta da API em milissegundos.")
    disclaimer: str = Field(
        default="Esta resposta é gerada por IA e deve ser verificada por um profissional jurídico qualificado. Não constitui aconselhamento jurídico formal.",
        description="Aviso legal padrão que acompanha todas as respostas da IA."
    )

class HealthResponse(BaseModel):
    status: str = Field(..., description="Status geral da aplicação (ex: 'healthy', 'unhealthy').")
    version: str = Field(..., description="Versão atual da API.")
    timestamp: str = Field(..., description="Timestamp da verificação de saúde no formato ISO 8601.")
    services: Dict[str, str] = Field(..., description="Status individual dos serviços internos (ex: 'orchestrator': 'healthy').")

# --- Dependências ---
async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verifica a chave API fornecida no cabeçalho de autorização."""
    if credentials.credentials != settings.API_KEY_FRONTEND:
        logger.warning("Tentativa de acesso não autorizado com chave inválida.",
                       provided_key_prefix=credentials.credentials[:5] + "...",
                       client_host=getattr(credentials, 'request', None) and credentials.request.client.host) # Adiciona contexto
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chave API inválida ou ausente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials

async def check_rate_limit(request: Request, api_key: str = Depends(verify_api_key)):
    """Verifica e impõe limites de taxa de requisições por cliente."""
    client_id = request.client.host if request.client else "unknown"
    
    # Adicionar o user_id do corpo da requisição ao rate limit, se disponível
    # Isso exigiria ler o corpo da requisição aqui, o que pode ser complicado.
    # Uma abordagem melhor seria passar o user_id para o rate_limiter a partir do endpoint /chat
    # Por simplicidade, mantemos apenas o IP do cliente aqui.

    if not await rate_limiter.check_limit(client_id):
        logger.warning("Limite de requisições excedido para o cliente.", client_id=client_id)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Limite de requisições excedido. Tente novamente em alguns minutos."
        )

async def get_orchestrator() -> LLMOrchestrator:
    """Dependência para obter a instância do LLMOrchestrator."""
    if not hasattr(app.state, 'orchestrator') or not app.state.orchestrator:
        logger.error("LLMOrchestrator não inicializado ou inacessível. Serviço temporariamente indisponível.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de orquestração indisponível. Por favor, tente novamente mais tarde."
        )
    return app.state.orchestrator

# --- Handlers de Exceções Globais ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler para exceções HTTP customizadas."""
    logger.warning(
        "HTTP Exception capturada",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path,
        method=request.method,
        client_host=request.client.host if request.client else "unknown"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "path": str(request.url.path)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler para todas as exceções não tratadas."""
    logger.error(
        "Erro interno não tratado no servidor",
        error=str(exc),
        path=request.url.path,
        method=request.method,
        client_host=request.client.host if request.client else "unknown",
        exc_info=True # Inclui o traceback completo nos logs
    )
    # Sentry também capturará este erro devido à integração FastApiIntegration
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Erro interno do servidor",
            "message": "Ocorreu um problema inesperado. Por favor, tente novamente em alguns instantes."
        }
    )

# --- Rotas da API ---
@app.get("/", response_model=Dict[str, Any], summary="Informações da API")
async def root():
    """Retorna informações básicas sobre a API Mozaia Legal Assistant."""
    return {
        "message": "Mozaia Legal Assistant API",
        "version": "1.0.0",
        "status": "active",
        "description": "Plataforma Jurídica Autônoma para Moçambique com IA Multi-Modal.",
        "docs_url": "/docs" if settings.ENVIRONMENT == "development" else "Disponível apenas em ambiente de desenvolvimento."
    }

@app.get("/health", response_model=HealthResponse, summary="Verificação de Saúde da Aplicação")
async def health_check():
    """
    Executa uma verificação de saúde da aplicação e de seus serviços principais.
    Retorna o status, versão, timestamp e status dos serviços.
    """
    services_status = {}

    # Verificar serviço do orquestrador LLM
    try:
        # Acesso direto ao app.state.orchestrator para o health check
        # Poderíamos adicionar um método 'is_healthy()' no orquestrador se ele tiver dependências internas
        if hasattr(app.state, 'orchestrator') and app.state.orchestrator:
            services_status["orchestrator"] = "healthy"
        else:
            services_status["orchestrator"] = "not_initialized"
    except Exception as e:
        logger.error("Falha na verificação de saúde do orquestrador", error=str(e))
        services_status["orchestrator"] = "unhealthy"

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(), # Formato ISO 8601
        services=services_status
    )

@app.post("/chat", response_model=ChatResponse, summary="Consulta Jurídica com IA")
async def legal_chat(
    request: ChatRequest,
    orchestrator: LLMOrchestrator = Depends(get_orchestrator), # Orquestrador injetado
    api_key: str = Depends(verify_api_key),
    _: None = Depends(check_rate_limit) # Aplica o limite de taxa
):
    """
    Processa uma pergunta jurídica usando múltiplos modelos de IA e o motor de consenso.
    Retorna uma resposta com nível de confiança, modelos utilizados e fontes.
    """
    start_time = time.time()

    logger.info(
        "Recebida nova consulta jurídica",
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        context=request.context,
        message_length=len(request.message),
        min_confidence=request.min_confidence,
        priority=request.priority
    )

    try:
        result = await orchestrator.get_legal_response(
            query=request.message,
            context=request.context,
            min_confidence=request.min_confidence,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            priority=request.priority # Passa a prioridade para o orquestrador
        )

        # O orquestrador deve levantar exceções em caso de erro, não retornar dicts com 'error'
        # Se LLMOrchestrator levanta LLMServiceError ou OrchestrationError:
        # result = await orchestrator.get_legal_response(...)

        response_time_ms = (time.time() - start_time) * 1000

        logger.info(
            "Consulta processada com sucesso",
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            confidence_score=result.get("confidence_score", 0),
            response_time_ms=response_time_ms,
            models_used=result.get("models_used", []),
            requires_human_review=result.get("requires_human_review", False)
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
        logger.error("Erro específico no orquestrador/LLM ao processar consulta",
                     error=str(e), code=e.code, user_id=request.user_id, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar consulta jurídica: {e.message}"
        )
    except HTTPException: # Re-lança HTTPExceptions que já foram intencionalmente levantadas
        raise
    except Exception as e: # Captura quaisquer outras exceções inesperadas
        logger.error("Erro inesperado e não tratado durante a consulta jurídica",
                     error=str(e), user_id=request.user_id, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar sua solicitação. Por favor, tente novamente mais tarde."
        )

@app.get("/metrics", summary="Métricas de Desempenho da API (Protegido)")
async def metrics(api_key: str = Depends(verify_api_key)):
    """
    Fornece métricas básicas de desempenho da aplicação, como total de requisições e tempo médio de resposta.
    Requer autenticação.
    """
    return {
        "requests_total": getattr(app.state, "requests_total", 0),
        "average_response_time_ms": getattr(app.state, "avg_response_time", 0), # Renomeado para clareza
        "active_connections": getattr(app.state, "active_connections", 0)
    }

# --- Execução da Aplicação (se executado diretamente) ---
if __name__ == "__main__":
    import uvicorn
    # Não defina log_config para usar a configuração do structlog
    uvicorn.run(
        "main:app", # Certifique-se de que o nome do arquivo seja 'main.py'
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development", # Recarrega automaticamente em desenvolvimento
        workers=1 if settings.ENVIRONMENT == "development" else (os.cpu_count() or 1) * 2, # Workers baseado nos núcleos da CPU
        log_config=None  # Desabilita o log padrão do uvicorn para usar o structlog
    )