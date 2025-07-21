# Integrating smart legal chat functionality by adding its router and updating import statements.
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import structlog
from typing import Dict, Any

from app.core.config import settings
from app.api.multimodal import router as multimodal_router
from app.api.handoff import router as handoff_router
from app.api.admin import router as admin_router
from app.api.legal_repository import router as legal_repository_router
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import structlog

from app.core.conversation_orchestrator import ConversationOrchestrator

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


# Test endpoint for frontend integration
@api_router.get("/test")
async def test_integration():
    """Endpoint de teste para verificar integração frontend-backend."""
    return {
        "status": "success",
        "message": "Backend conectado com sucesso!",
        "timestamp": "2025-01-20T16:25:01Z",
        "backend_version": settings.PROJECT_VERSION
    }

# Endpoint para testar conversas
@api_router.get("/conversations")
async def get_conversations():
    """Endpoint de teste para listar conversas."""
    # Mock data para teste
    return {
        "conversations": [
            {
                "id": "1",
                "title": "Conversa de Teste",
                "created_at": "2025-01-20T16:00:00Z",
                "updated_at": "2025-01-20T16:20:00Z",
                "message_count": 2,
                "context": "general",
                "user_id": "user_1"
            }
        ],
        "total": 1
    }

# Endpoint para testar mensagens
@api_router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str):
    """Endpoint de teste para listar mensagens."""
    return {
        "messages": [
            {
                "id": "msg_1",
                "conversation_id": conversation_id,
                "role": "user",
                "content": "Olá! Como você está?",
                "created_at": "2025-01-20T16:00:00Z"
            },
            {
                "id": "msg_2", 
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": "Olá! Estou bem e pronto para ajudar. Como posso auxiliá-lo hoje?",
                "created_at": "2025-01-20T16:00:30Z"
            }
        ],
        "total": 2
    }


# Inclui o roteador do LLM no roteador principal
api_router.include_router(llm_router)
api_router.include_router(multimodal_router)
api_router.include_router(handoff_router)
api_router.include_router(admin_router)
api_router.include_router(legal_repository_router)
from app.api import websocket, technician, test_integration, professional_management, professional_auth, smart_legal_chat, glossario
api_router.include_router(websocket.router)
api_router.include_router(technician.router)
api_router.include_router(test_integration.router)
api_router.include_router(professional_management.router)
api_router.include_router(professional_auth.router)

# Rotas do repositório legal
api_router.include_router(legal_repository_router)

# Chat inteligente com base legal
api_router.include_router(smart_legal_chat.router)

# Testes simples
from app.api import test_simple
api_router.include_router(test_simple.router)