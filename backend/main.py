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
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total de requisições HTTP",
    ["method", "path", "status_code"]
)
HTTP_REQUESTS_DURATION_SECONDS = Histogram(
    "http_requests_duration_seconds",
    "Duração das requisições HTTP em segundos",
    ["method", "path"]
)
HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "http_requests_in_progress",
    "Número de requisições HTTP em andamento",
    ["method", "path"]
)

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

def setup_logging():
    # Sua implementação de logging continua aqui
    pass

logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("🚀 Iniciando Mozaia LLM Orchestrator...")
    orchestrator = LLMOrchestrator(
        pool_config=settings.llm_pool,
        consensus_config=settings.consensus,
    )
    await orchestrator.initialize()
    app.state.orchestrator = orchestrator
    yield
    logger.info("🛑 Finalizando Mozaia LLM Orchestrator...")
    await app.state.orchestrator.close()

app = FastAPI(
    title="Mozaia LLM Orchestrator",
    version="1.0.0",
    description="Orquestrador de LLMs de alta performance.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.server.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PrometheusMiddleware)

@app.exception_handler(MozaiaError)
async def mozaia_exception_handler(request: Request, exc: MozaiaError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_code, "message": exc.message},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro não tratado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "internal_server_error", "message": "Ocorreu um erro inesperado."},
    )

@app.get("/metrics", tags=["Monitoring"])
def get_metrics():
    return Response(content=generate_latest(REGISTRY), media_type="text/plain")

@app.get("/health", tags=["Monitoring"], response_model=HealthStatus)
async def health_check(session: AsyncGenerator = Depends(get_db_session)):
    db_ok, db_latency = await ping_database(session)
    dependencies = [HealthCheckDependency(name="database", status="ok" if db_ok else "error", latency=db_latency)]
    overall_status = "ok" if all(dep.status == "ok" for dep in dependencies) else "error"
    
    if overall_status == "error":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=HealthStatus(status=overall_status, dependencies=dependencies).dict()
        )
    return HealthStatus(status=overall_status, dependencies=dependencies)

@app.post("/v1/generate", tags=["LLM Orchestrator"], response_model=OrchestratorResponse)
async def generate(request: Request, params: GenerationParams):
    orchestrator: LLMOrchestrator = request.app.state.orchestrator
    response = await orchestrator.generate(prompt=params.prompt, params=params, context=params.context)
    return response

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.server.host, port=settings.server.port, reload=True)
