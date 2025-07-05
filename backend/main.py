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
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

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

# ... (o resto das suas importações)

# --- Configuração de Logging ---
# (A sua função setup_logging() continua a mesma, está bem estruturada)
def setup_logging():
    # ... (código existente)
    pass

logger = setup_logging()


# --- Gerenciamento do Ciclo de Vida da Aplicação ---
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Gerencia o ciclo de vida da aplicação, inicializando e
    finalizando recursos como o orquestrador de LLMs.
    """
    logger.info("🚀 Iniciando Mozaia LLM Orchestrator...")
    
    # Inicializa o orquestrador
    orchestrator = LLMOrchestrator(
        pool_config=settings.llm_pool,
        consensus_config=settings.consensus,
    )
    await orchestrator.initialize()
    app.state.orchestrator = orchestrator

    yield

    logger.info("🛑 Finalizando Mozaia LLM Orchestrator...")
    await app.state.orchestrator.close()
    logger.info("✅ Aplicação finalizada com sucesso.")


# --- Criação da Aplicação FastAPI ---
app = FastAPI(
    title="Mozaia LLM Orchestrator",
    version="1.0.0",
    description="Orquestrador de LLMs de alta performance com foco em resiliência e consenso.",
    lifespan=lifespan,
    # Adiciona documentação OpenAPI customizada se necessário
    # openapi_url="/api/v1/openapi.json",
    # docs_url="/docs",
)

# --- Middlewares ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.server.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (O seu ObservabilityMiddleware pode ser mantido ou substituído por Prometheus)
class ObservabilityMiddleware(BaseHTTPMiddleware):
    # ... (código existente)
    pass
app.add_middleware(ObservabilityMiddleware)


# --- Handlers de Exceção ---
@app.exception_handler(MozaiaError)
async def mozaia_exception_handler(request: Request, exc: MozaiaError):
    """Handler para exceções customizadas da aplicação."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_code, "message": exc.message},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handler para exceções não tratadas, evitando vazamento de detalhes."""
    logger.error(f"Erro não tratado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "message": "Ocorreu um erro inesperado no servidor.",
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para erros de validação do Pydantic."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "validation_error", "detail": exc.errors()},
    )


# --- Endpoints da API ---
@app.get(
    "/health",
    tags=["Monitoring"],
    summary="Verifica a saúde da aplicação e suas dependências",
    response_model=HealthStatus,
)
async def health_check(session: AsyncGenerator = Depends(get_db_session)):
    """
    Endpoint de Health Check.

    Verifica a saúde da API e de suas dependências críticas, como o banco de dados.
    Retorna o status 'ok' se tudo estiver funcionando ou 'error' caso contrário.
    """
    db_ok, db_latency = await ping_database(session)
    
    dependencies = [
        HealthCheckDependency(name="database", status="ok" if db_ok else "error", latency=db_latency)
    ]
    
    overall_status = "ok" if all(dep.status == "ok" for dep in dependencies) else "error"
    
    if overall_status == "error":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=HealthStatus(status=overall_status, dependencies=dependencies).dict()
        )
        
    return HealthStatus(status=overall_status, dependencies=dependencies)


@app.post(
    "/v1/generate",
    tags=["LLM Orchestrator"],
    summary="Gera texto usando o orquestrador de LLMs",
    response_model=OrchestratorResponse,
)
async def generate(
    request: Request,
    params: GenerationParams,
):
    """
    Recebe um prompt e parâmetros de geração, orquestra a chamada
    para um ou mais LLMs e retorna a resposta consolidada.
    """
    orchestrator: LLMOrchestrator = request.app.state.orchestrator
    
    response = await orchestrator.generate(
        prompt=params.prompt,
        params=params,
        context=params.context,
    )
    
    return response

# ... (outros endpoints, se houver)

# --- Ponto de Entrada para Execução ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.server.host,
        port=settings.server.port,
        reload=True,  # O reload fica apenas para a execução local
        log_level=logging.getLevelName(logger.level).lower(),
    )
