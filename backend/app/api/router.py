
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
import structlog
from typing import Dict, Any

from app.core.config import settings

logger = structlog.get_logger(__name__)

api_router = APIRouter()


@api_router.get("/")
async def root():
    """Endpoint raiz da API."""
    return {
        "message": "Muzaia Backend API",
        "version": settings.PROJECT_VERSION,
        "status": "running"
    }


@api_router.get("/health")
async def health_check():
    """Endpoint de verificação de saúde da aplicação."""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.PROJECT_VERSION
        }
    )


@api_router.get("/status")
async def get_status():
    """Retorna informações detalhadas sobre o status do sistema."""
    return {
        "api_status": "running",
        "database_status": "connected",
        "llm_status": "available",
        "version": settings.PROJECT_VERSION,
        "environment": "development" if settings.DEBUG else "production"
    }


# Roteador para endpoints relacionados ao LLM
llm_router = APIRouter(prefix="/llm", tags=["llm"])


@llm_router.post("/generate")
async def generate_response(prompt: str):
    """Gera uma resposta usando o LLM."""
    try:
        # Implementação futura
        response = f"Generated response for: {prompt[:50]}..."
        return {"response": response}
    except Exception as e:
        logger.error("Error generating response", error=str(e))
        raise HTTPException(status_code=500, detail="Error generating response")


# Inclui o roteador do LLM no roteador principal
api_router.include_router(llm_router)
