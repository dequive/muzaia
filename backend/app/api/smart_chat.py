
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Optional, Dict, Any
import structlog
import json

from app.core.conversation_orchestrator import ConversationOrchestrator
from app.database.connection import get_db_session

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/smart-chat", tags=["smart-chat"])
orchestrator = ConversationOrchestrator()


@router.post("/message")
async def process_smart_message(
    conversation_id: str,
    user_id: str,
    message: str,
    context: Optional[Dict[str, Any]] = None
):
    """
    Endpoint inteligente que decide automaticamente se encaminha para IA ou técnico.
    """
    try:
        # Processar mensagem através do orquestrador
        result = await orchestrator.handle_message(
            conversation_id=conversation_id,
            user_id=user_id,
            message=message,
            context=context or {}
        )
        
        response_data = {
            "conversation_id": conversation_id,
            "mode": result["current_mode"],
            "should_escalate": result["should_escalate"]
        }
        
        # Se deve escalonar, iniciar handoff automaticamente
        if result.get("recommendation") == "initiate_handoff":
            handoff_result = await orchestrator.initiate_handoff(
                conversation_id=conversation_id,
                user_id=user_id,
                reason=result.get("escalation_reason")
            )
            
            response_data.update({
                "handoff_initiated": True,
                "handoff_id": handoff_result["handoff_id"],
                "escalation_reason": result.get("escalation_reason"),
                "message": "Transferindo para técnico especializado..."
            })
        else:
            # Continuar com IA normal
            response_data.update({
                "handoff_initiated": False,
                "message": "Processando com IA..."
            })
        
        return JSONResponse(response_data)
        
    except Exception as e:
        logger.error("Error in smart chat processing", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/{conversation_id}/status")
async def get_conversation_status(conversation_id: str):
    """Obtém status atual da conversa."""
    try:
        conversation = orchestrator.active_conversations.get(conversation_id, {})
        
        return JSONResponse({
            "conversation_id": conversation_id,
            "mode": conversation.get("mode", "ai_only"),
            "handoff_id": conversation.get("handoff_id"),
            "technician_id": conversation.get("technician_id"),
            "message_count": len(conversation.get("history", []))
        })
        
    except Exception as e:
        logger.error("Error getting conversation status", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversation/{conversation_id}/force-handoff")
async def force_handoff(
    conversation_id: str,
    user_id: str,
    specialization: str = "general",
    reason: Optional[str] = None
):
    """Força transferência para técnico (quando usuário solicita explicitamente)."""
    try:
        result = await orchestrator.initiate_handoff(
            conversation_id=conversation_id,
            user_id=user_id,
            specialization=specialization,
            reason=reason or "Solicitação manual do usuário"
        )
        
        return JSONResponse({
            "success": True,
            "handoff_id": result["handoff_id"],
            "message": "Transferência iniciada. Procurando técnico disponível..."
        })
        
    except Exception as e:
        logger.error("Error forcing handoff", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
