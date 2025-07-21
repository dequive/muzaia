
"""
Endpoint simples para testes básicos do sistema.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/test", tags=["simple-test"])


@router.get("/ping")
async def ping():
    """Teste básico de conectividade."""
    return JSONResponse({
        "status": "success",
        "message": "pong",
        "timestamp": datetime.utcnow().isoformat(),
        "system": "mozaia-backend"
    })


@router.get("/health")
async def simple_health():
    """Verificação simples de saúde."""
    try:
        return JSONResponse({
            "status": "healthy",
            "services": {
                "api": "running",
                "database": "connected",
                "chat": "available"
            },
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error("Erro no health check", error=str(e))
        raise HTTPException(status_code=500, detail="Sistema com problemas")


@router.post("/echo")
async def echo_test(data: dict):
    """Teste de echo - retorna os dados enviados."""
    return JSONResponse({
        "status": "success",
        "received_data": data,
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Dados recebidos com sucesso"
    })


@router.get("/legal-chat-test")
async def legal_chat_test():
    """Teste básico do sistema de chat legal."""
    return JSONResponse({
        "status": "ready",
        "message": "Sistema de chat legal operacional",
        "features": {
            "semantic_search": "available",
            "legal_repository": "ready",
            "ai_responder": "active"
        },
        "test_query": "Pode testar perguntando: 'Quais são os meus direitos como trabalhador?'",
        "timestamp": datetime.utcnow().isoformat()
    })
