
"""
API endpoints para transferência de conversas para técnicos.
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
import structlog
import json
from datetime import datetime

from app.database.connection import get_db_session
from app.models.human_handoff import (
    HandoffManager, HandoffRequest, TechnicianStatus, 
    Specialization, ConversationHandoff, Technician
)
from app.schemas import BaseResponse

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/handoff", tags=["handoff"])


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        # Conexões ativas por tipo de usuário
        self.technician_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, WebSocket] = {}
    
    async def connect_technician(self, technician_id: str, websocket: WebSocket):
        await websocket.accept()
        self.technician_connections[technician_id] = websocket
        logger.info("Technician connected", technician_id=technician_id)
    
    async def connect_user(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.user_connections[user_id] = websocket
        logger.info("User connected", user_id=user_id)
    
    def disconnect_technician(self, technician_id: str):
        if technician_id in self.technician_connections:
            del self.technician_connections[technician_id]
            logger.info("Technician disconnected", technician_id=technician_id)
    
    def disconnect_user(self, user_id: str):
        if user_id in self.user_connections:
            del self.user_connections[user_id]
            logger.info("User disconnected", user_id=user_id)
    
    async def notify_technician(self, technician_id: str, message: dict):
        if technician_id in self.technician_connections:
            websocket = self.technician_connections[technician_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error("Failed to notify technician", error=str(e))
                self.disconnect_technician(technician_id)
    
    async def notify_user(self, user_id: str, message: dict):
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error("Failed to notify user", error=str(e))
                self.disconnect_user(user_id)
    
    async def broadcast_to_available_technicians(self, message: dict, specialization: str = None):
        """Notifica todos os técnicos disponíveis."""
        for technician_id, websocket in self.technician_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error("Failed to broadcast to technician", error=str(e))


manager = ConnectionManager()


@router.post("/request")
async def request_handoff(
    conversation_id: str,
    user_id: str,
    specialization: str = "general",
    priority: str = "normal",
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """Solicita transferência de conversa para técnico."""
    try:
        handoff_manager = HandoffManager(db)
        
        # Criar request
        request = HandoffRequest(
            conversation_id=conversation_id,
            user_id=user_id,
            specialization=Specialization(specialization),
            priority=priority,
            reason=reason
        )
        
        # TODO: Gerar resumo da conversa com IA
        ai_summary = f"Conversa iniciada por {user_id}. Especialização solicitada: {specialization}."
        
        # Processar transferência
        handoff = await handoff_manager.request_handoff(request, ai_summary)
        
        # Notificar técnicos disponíveis via WebSocket
        notification = {
            "type": "new_handoff_request",
            "handoff_id": str(handoff.id),
            "conversation_id": conversation_id,
            "specialization": specialization,
            "priority": priority,
            "reason": reason,
            "summary": ai_summary,
            "created_at": handoff.created_at.isoformat()
        }
        await manager.broadcast_to_available_technicians(notification, specialization)
        
        return JSONResponse({
            "success": True,
            "handoff_id": str(handoff.id),
            "status": handoff.status.value,
            "message": "Solicitação enviada. Procurando técnico disponível..."
        })
        
    except Exception as e:
        logger.error("Error requesting handoff", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/accept/{handoff_id}")
async def accept_handoff(
    handoff_id: str,
    technician_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Técnico aceita transferência."""
    try:
        handoff_manager = HandoffManager(db)
        success = await handoff_manager.accept_handoff(handoff_id, technician_id)
        
        if success:
            # Notificar usuário que técnico aceitou
            handoff = await db.get(ConversationHandoff, handoff_id)
            if handoff:
                notification = {
                    "type": "handoff_accepted",
                    "handoff_id": handoff_id,
                    "technician_name": handoff.technician.name if handoff.technician else "Técnico",
                    "message": f"Técnico {handoff.technician.name} entrou na conversa"
                }
                await manager.notify_user(handoff.requested_by, notification)
            
            return JSONResponse({
                "success": True,
                "message": "Transferência aceita com sucesso"
            })
        else:
            raise HTTPException(status_code=400, detail="Não foi possível aceitar a transferência")
            
    except Exception as e:
        logger.error("Error accepting handoff", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complete/{handoff_id}")
async def complete_handoff(
    handoff_id: str,
    notes: Optional[str] = None,
    rating: Optional[int] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """Completa transferência."""
    try:
        handoff_manager = HandoffManager(db)
        success = await handoff_manager.complete_handoff(handoff_id, notes, rating)
        
        if success:
            return JSONResponse({
                "success": True,
                "message": "Atendimento finalizado"
            })
        else:
            raise HTTPException(status_code=400, detail="Não foi possível finalizar")
            
    except Exception as e:
        logger.error("Error completing handoff", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending")
async def get_pending_handoffs(
    technician_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """Lista transferências pendentes."""
    try:
        handoff_manager = HandoffManager(db)
        handoffs = await handoff_manager.get_pending_handoffs(technician_id)
        
        return JSONResponse({
            "success": True,
            "handoffs": [
                {
                    "id": str(h.id),
                    "conversation_id": str(h.conversation_id),
                    "specialization": h.specialization_requested.value,
                    "priority": h.priority,
                    "reason": h.reason,
                    "summary": h.ai_summary,
                    "created_at": h.created_at.isoformat()
                }
                for h in handoffs
            ]
        })
        
    except Exception as e:
        logger.error("Error getting pending handoffs", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/technician/status")
async def update_technician_status(
    technician_id: str,
    status: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Atualiza status do técnico."""
    try:
        handoff_manager = HandoffManager(db)
        success = await handoff_manager.update_technician_presence(
            technician_id, TechnicianStatus(status)
        )
        
        if success:
            return JSONResponse({
                "success": True,
                "message": f"Status atualizado para {status}"
            })
        else:
            raise HTTPException(status_code=404, detail="Técnico não encontrado")
            
    except Exception as e:
        logger.error("Error updating technician status", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket endpoints
@router.websocket("/ws/technician/{technician_id}")
async def websocket_technician(
    websocket: WebSocket,
    technician_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """WebSocket para técnicos."""
    await manager.connect_technician(technician_id, websocket)
    
    # Atualizar status para online
    handoff_manager = HandoffManager(db)
    await handoff_manager.update_technician_presence(
        technician_id, TechnicianStatus.ONLINE
    )
    
    try:
        while True:
            # Aguardar mensagens do técnico
            data = await websocket.receive_json()
            
            # Processar diferentes tipos de mensagem
            message_type = data.get("type")
            
            if message_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif message_type == "status_update":
                new_status = TechnicianStatus(data.get("status"))
                await handoff_manager.update_technician_presence(
                    technician_id, new_status
                )
            
    except WebSocketDisconnect:
        manager.disconnect_technician(technician_id)
        # Atualizar status para offline
        await handoff_manager.update_technician_presence(
            technician_id, TechnicianStatus.OFFLINE
        )


@router.websocket("/ws/user/{user_id}")
async def websocket_user(websocket: WebSocket, user_id: str):
    """WebSocket para usuários."""
    await manager.connect_user(user_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Processar mensagens do usuário
            message_type = data.get("type")
            
            if message_type == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect_user(user_id)
