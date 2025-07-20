# Updated exception handler to use correct class name

import logging
from contextlib import asynccontextmanager

import structlog
import uvicorn
from asgi_correlation_id import CorrelationIdMiddleware
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.orchestrator import LLMOrchestrator
from app.core.exceptions import MuzaiaError
from app.core.logging import setup_logging
from app.api.router import api_router
from prometheus_fastapi_instrumentator import Instrumentator, metrics

# Configuração centralizada do logging e métricas
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação.
    - Inicializa o LLMOrchestrator com os modelos definidos nas configurações.
    - Pré-carrega os modelos para evitar latência na primeira requisição.
    """
    logger.info("Initializing application lifespan...")
    try:
        llm_orchestrator = LLMOrchestrator(
            llm_pool=settings.llm_pool,
            model_name=settings.model_name,
        )
        # Se houver uma função de preload, ela seria chamada aqui.
        # Ex: await llm_orchestrator.preload_models()
        app.state.llm_orchestrator = llm_orchestrator
        logger.info(
            "LLM Orchestrator initialized successfully.",
            model_name=settings.model_name,
            llm_pool=settings.llm_pool,
        )
        yield
    except Exception as e:
        logger.exception("Failed to initialize LLM Orchestrator.", error=e)
        # Se a inicialização falhar, podemos decidir parar a aplicação.
        # Neste caso, apenas logamos e continuamos para que a API
        # possa responder com erros, se necessário.
        yield
    finally:
        # Lógica de limpeza ao finalizar a aplicação (se necessário)
        logger.info("Application shutdown.")


app = FastAPI(
    title=settings.project_name,
    version=settings.project_version,
    lifespan=lifespan,
)

# --- Middlewares ---
# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Métricas do Prometheus
instrumentator = Instrumentator()
instrumentator.instrument(app)
instrumentator.expose(app)
# ID de correlação para rastreabilidade dos logs
app.add_middleware(CorrelationIdMiddleware)

# --- Endpoints ---
# Root endpoint
@app.get("/")
async def root():
    """Root endpoint that redirects to API documentation."""
    return {
        "message": "Muzaia Backend API",
        "version": settings.project_version,
        "status": "running",
        "docs": "/docs",
        "api": settings.api_prefix
    }

# Roteador principal da API
app.include_router(api_router, prefix=settings.api_prefix)


# --- Handlers de Exceção ---
@app.exception_handler(MuzaiaError)
async def mozaia_exception_handler(request, exc: MuzaiaError):
    """Handler para exceções customizadas da aplicação."""
    logger.error(
        "Application error occurred.",
        error=exc.message,
        status_code=exc.status_code,
        detail=exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.message, "detail": exc.detail},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    """Handler para exceções HTTP (ex: 404 Not Found)."""
    logger.warning(
        "HTTP exception occurred.",
        status_code=exc.status_code,
        detail=exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": "HTTP Error", "detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handler para erros de validação do Pydantic."""
    logger.warning(
        "Request validation error.",
        errors=exc.errors(),
        body=exc.body,
    )
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    """Handler para exceções genéricas e não tratadas."""
    logger.exception("An unhandled exception occurred.", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal Server Error",
            "detail": "An unexpected error occurred on the server.",
        },
    )


# --- Ponto de Entrada ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
    )