# -*- coding: utf-8 -*-
"""
Ponto de Entrada Principal da Aplicação Mozaia LLM Orchestrator.
API FastAPI enterprise-grade com observabilidade completa,
resiliência, monitoramento e gestão robusta de recursos.
"""
from __future__ import annotations

import logging
import sys
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import uvicorn
import structlog
from fastapi import FastAPI, Request, status, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import (
    Counter, Histogram, Gauge, REGISTRY, generate_latest
)

from app.core.config import settings
from app.core.exceptions import MozaiaError
from app.core.orchestrator import LLMOrchestrator
from app.database.session import get_db_session, ping_database
from app.schemas import (
    GenerationParams,
    OrchestratorResponse,
    HealthStatus,
    HealthCheckDependency,
)

# --- Métricas do Prometheus ---
HTTP_REQUESTS_TOTAL = Counter("http_requests_total", "Total de requisições HTTP", ["method", "path", "status_code"])
HTTP_REQUESTS_DURATION_SECONDS = Histogram("http_requests_duration_seconds", "Duração das requisições HTTP em segundos", ["method", "path"])
HTTP_REQUESTS_IN_PROGRESS = Gauge("http_requests_in_progress", "Número de requisições HTTP em andamento", ["method", "path"])


# --- Middleware de Métricas do Prometheus ---
class PrometheusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        if path == "/metrics":
            return await call_next(request)
        HTTP_REQUESTS_IN_PROGRESS.labels(method=method, path=path).inc()
        start_time = time.time()
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise e
        finally:
            duration = time.time() - start_time
            HTTP_REQUESTS_DURATION_SECONDS.labels(method=method, path=path).observe(duration)
            HTTP_REQUESTS_TOTAL.labels(method=method, path=path, status_code=status_code).inc()
            HTTP_REQUESTS_IN_PROGRESS.labels(method=method, path=path).dec()
        return response


# --- Configuração de Logging Estruturado ---
def setup_logging():
    """
    Configura o logging estruturado usando structlog para toda a aplicação.
    Em ambiente de desenvolvimento, usa um formato legível no console.
    Em outros ambientes (produção), emite logs em JSON.
    """
    log_level = "DEBUG" if settings.debug else "INFO"
    
    # Processadores compartilhados para todos os ambientes
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    if settings.debug:
        # Formato colorido e legível para desenvolvimento
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # Formato JSON para produção
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]

    # Configura o structlog
    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configura os loggers padrão do Python para usar o pipeline do structlog
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)
    
    # Silencia loggers muito verbosos de bibliotecas de terceiros
    logging.getLogger("uvicorn.access").setLevel("WARNING")
    logging.getLogger("uvicorn.error").setLevel("WARNING")
    logging.getLogger("aiohttp").setLevel("WARNING")

# Executa a configuração de logging ao iniciar o módulo
setup_logging()
logger = structlog.get_logger(__name__)


# --- Ciclo de Vida da Aplicação ---
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("application_startup", stage="starting")
    orchestrator = LLMOrchestrator(
        pool_config=settings.llm_pool,
        consensus_config=settings.consensus,
    )
    await orchestrator.initialize()
    app.state.orchestrator = orchestrator
    logger.info("application_startup", stage="complete")
    yield
    logger.info("application_shutdown", stage="starting")
    await app.state.orchestrator.close()
    logger.info("application_shutdown", stage="complete")


# --- Criação da Aplicação FastAPI ---
app = FastAPI(
    title="Mozaia LLM Orchestrator",
    version="1.0.0",
    description="Orquestrador de LLMs de alta performance.",
    lifespan=lifespan,
)

# --- Middlewares ---
app.add_middleware(CORSMiddleware, allow_origins=[str(origin) for origin in settings.server.cors_origins], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(PrometheusMiddleware)


# --- Handlers de Exceção ---
@app.exception_handler(MozaiaError)
async def mozaia_exception_handler(request: Request, exc: MozaiaError):
    logger.warning("application_error", error_code=exc.error_code, detail=exc.message, path=request.url.path)
    return JSONResponse(status_code=exc.status_code, content={"error": exc.error_code, "message": exc.message})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, exc_info=True)
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": "internal_server_error", "message": "Ocorreu um erro inesperado."})


# --- Endpoints da API ---
@app.get("/metrics", tags=["Monitoring"])
def get_metrics():
    return Response(content=generate_latest(REGISTRY), media_type="text/plain")

@app.get("/health", tags=["Monitoring"], response_model=HealthStatus)
async def health_check(session: AsyncGenerator = Depends(get_db_session)):
    db_ok, db_latency = await ping_database(session)
    dependencies = [HealthCheckDependency(name="database", status="ok" if db_ok else "error", latency=db_latency)]
    overall_status = "ok" if all(dep.status == "ok" for dep in dependencies) else "error"
    if overall_status == "error":
        logger.error("health_check_failed", dependencies=dependencies)
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=HealthStatus(status=overall_status, dependencies=dependencies).dict())
    return HealthStatus(status=overall_status, dependencies=dependencies)

@app.post("/v1/generate", tags=["LLM Orchestrator"], response_model=OrchestratorResponse)
async def generate(request: Request, params: GenerationParams):
    orchestrator: LLMOrchestrator = request.app.state.orchestrator
    # Exemplo de como adicionar contexto ao log
    structlog.contextvars.bind_contextvars(prompt_length=len(params.prompt))
    response = await orchestrator.generate(prompt=params.prompt, params=params, context=params.context)
    return response


# --- Ponto de Entrada para Execução ---
if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.server.host, port=settings.server.port, reload=True, log_config=None)
