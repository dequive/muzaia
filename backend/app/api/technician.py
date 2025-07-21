
"""
API para gestão de técnicos e presença.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import structlog

from app.database.connection import get_db_session
from app.models.human_handoff import (
    HandoffManager, TechnicianStatus, Technician, TechnicianPresence
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/technician", tags=["technician"])


@router.post("/presence")
async def update_presence(
    technician_id: str,
    status: str,
    extra_data: Optional[dict] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """Atualiza presença do técnico."""
    try:
        handoff_manager = HandoffManager(db)
        
        # Validar status
        if status not in ['online', 'offline', 'busy', 'away']:
            raise HTTPException(status_code=400, detail="Status inválido")
        
        tech_status = TechnicianStatus(status)
        
        success = await handoff_manager.update_technician_presence(
            technician_id=technician_id,
            status=tech_status,
            extra_data=extra_data
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Técnico não encontrado")
        
        return JSONResponse({
            "success": True,
            "status": status,
            "message": f"Status atualizado para {status}"
        })
        
    except Exception as e:
        logger.error("Error updating technician presence", 
                    technician_id=technician_id, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/presence/all")
async def get_all_presence(
    db: AsyncSession = Depends(get_db_session)
):
    """Retorna presença de todos os técnicos."""
    try:
        handoff_manager = HandoffManager(db)
        presence_list = await handoff_manager.get_all_technicians_presence()
        
        return JSONResponse({
            "success": True,
            "data": [
                {
                    "technician_id": p.technician_id,
                    "status": p.status.value,
                    "current_load": p.current_load,
                    "max_load": p.max_load,
                    "specializations": p.specializations,
                    "last_activity": p.last_activity.isoformat() if p.last_activity else None
                }
                for p in presence_list
            ]
        })
        
    except Exception as e:
        logger.error("Error getting technician presence", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/availability/stats")
async def get_availability_stats(
    db: AsyncSession = Depends(get_db_session)
):
    """Retorna estatísticas de disponibilidade."""
    try:
        handoff_manager = HandoffManager(db)
        stats = await handoff_manager.get_availability_stats()
        
        return JSONResponse({
            "success": True,
            "data": stats
        })
        
    except Exception as e:
        logger.error("Error getting availability stats", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/{technician_id}/active-conversations")
async def get_active_conversations(
    technician_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Retorna conversas ativas do técnico."""
    try:
        # Query conversas ativas do técnico
        result = await db.execute("""
            SELECT 
                ch.conversation_id,
                ch.requested_by as user_id,
                ch.accepted_at,
                ch.status
            FROM mozaia.conversation_handoffs ch
            WHERE ch.technician_id = :technician_id 
            AND ch.status = 'accepted'
            ORDER BY ch.accepted_at DESC
        """, {"technician_id": technician_id})
        
        conversations = result.fetchall()
        
        return JSONResponse({
            "success": True,
            "data": [
                {
                    "conversation_id": str(conv.conversation_id),
                    "user_id": conv.user_id,
                    "started_at": conv.accepted_at.isoformat() if conv.accepted_at else None,
                    "status": conv.status
                }
                for conv in conversations
            ]
        })
        
    except Exception as e:
        logger.error("Error getting active conversations", 
                    technician_id=technician_id, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")
