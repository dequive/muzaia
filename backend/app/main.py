# -*- coding: utf-8 -*-
"""
Ponto de entrada principal da aplicação Mozaia LLM Orchestrator.

Este ficheiro configura e executa a API FastAPI, gere o ciclo de vida
da aplicação e expõe os endpoints para interação com o orquestrador.
"""

import logging
import aiohttp
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.orchestrator import LLMOrchestrator
from app.schemas import (
    GenerationParams, 
    OrchestratorResponse, 
    ContextType
)
from app.core.exceptions import (
    LLMOrchestratorError, 
    InvalidInputError, 
    RateLimitError,
    ConsensusError
)

# Configuração de logging
logging.basicConfig(level=logging.DEBUG if settings.debug else logging.INFO)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gere o ciclo de vida da aplicação.
    Inicializa e fecha recursos essenciais como a sessão HTTP e o orquestrador.
    """
    log.info("Iniciando a aplicação...")
    
    # 1. Criação de recursos que serão partilhados durante a vida da aplicação
    session = aiohttp.ClientSession()
    orchestrator = LLMOrchestrator(session)
    
    # 2. Inicialização assíncrona do orquestrador (carrega modelos, etc.)
    await orchestrator.initialize()
    
    # 3. Armazena os recursos no estado da aplicação para acesso nos endpoints
    app.state.orchestrator = orchestrator
    
    log.info("Aplicação iniciada com sucesso.")
    
    yield  # A aplicação está agora a correr e a aceitar pedidos
    
    # --- Código de limpeza executado ao encerrar a aplicação ---
    log.info("Encerrando a aplicação...")
    await session.close()
    log.info("Recursos limpos. Aplicação encerrada.")


# Criação da instância da aplicação FastAPI com o gestor de ciclo de vida
app = FastAPI(
    title="Mozaia LLM Orchestrator",
    description="Orquestrador avançado para múltiplos LLMs com foco em resiliência e consenso.",
    version="1.0.0",
    lifespan=lifespan
)


# --- Modelos de Dados para a API (Request Body) ---
from pydantic import BaseModel, Field

class GenerationRequest(BaseModel):
    """Schema para o corpo do pedido do endpoint de geração."""
    query: str = Field(..., min_length=10, max_length=settings.orchestrator.max_query_length, description="A pergunta ou instrução para o LLM.")
    context: ContextType = Field(ContextType.GENERAL, description="O contexto de negócio para roteamento de modelos.")
    user_id: str = Field(..., min_length=1, description="Identificador único do utilizador para rate limiting.")
    params: Optional[GenerationParams] = Field(None, description="Parâmetros de geração opcionais para a consulta.")
    min_confidence: float = Field(0.65, ge=0.5, le=1.0, description="Limiar de confiança mínimo para a resposta de consenso.")


# --- Endpoints da API ---

@app.post("/api/v1/generate", response_model=OrchestratorResponse, tags=["LLM Orchestrator"])
async def generate_response(request: Request, payload: GenerationRequest) -> JSONResponse:
    """
    Recebe uma consulta e orquestra múltiplos LLMs para gerar uma resposta consensual.
    """
    orchestrator: LLMOrchestrator = request.app.state.orchestrator

    try:
        result = await orchestrator.generate(
            query=payload.query,
            context=payload.context.value,
            user_id=payload.user_id,
            params=payload.params,
            min_confidence=payload.min_confidence
        )
        return JSONResponse(content=result.to_dict(), status_code=status.HTTP_200_OK)

    except InvalidInputError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
    except (ConsensusError, LLMOrchestratorError) as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        log.error(f"Erro inesperado no endpoint /generate: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno inesperado.")

@app.get("/health", status_code=status.HTTP_200_OK, tags=["Monitoring"])
async def health_check():
    """Verifica a saúde da aplicação."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
