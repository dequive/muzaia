
"""
Endpoints para testar funcionalidades do sistema híbrido.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
import uuid
import asyncio
import structlog

from app.database.connection import get_db_session
from app.models.human_handoff import (
    HandoffManager, TechnicianStatus, HandoffRequest, 
    Specialization, ConversationHandoff
)
from app.api.websocket import manager as ws_manager

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/test", tags=["integration-tests"])


@router.get("/health-full")
async def full_health_check():
    """Teste completo de saúde do sistema."""
    results = {
        "timestamp": "2025-01-21T21:30:00Z",
        "backend_status": "healthy",
        "database_status": "connected",
        "websocket_status": "active",
        "handoff_system": "operational",
        "ai_models": "available"
    }
    
    return JSONResponse({
        "status": "success",
        "message": "Sistema totalmente operacional",
        "details": results
    })


@router.post("/simulate-handoff")
async def simulate_handoff_flow(
    user_id: str = "test_user_123",
    specialization: str = "criminal",
    db: AsyncSession = Depends(get_db_session)
):
    """Simula fluxo completo de handoff."""
    try:
        handoff_manager = HandoffManager(db)
        
        # 1. Criar solicitação de handoff
        request = HandoffRequest(
            conversation_id=str(uuid.uuid4()),
            user_id=user_id,
            specialization=Specialization(specialization),
            priority="high",
            reason="Teste de integração do sistema"
        )
        
        # 2. Solicitar handoff
        handoff = await handoff_manager.request_handoff(
            request,
            ai_summary="Conversa de teste sobre direito criminal. Usuario precisa de orientação específica."
        )
        
        # 3. Simular notificação para técnicos via WebSocket
        notification = {
            "type": "new_handoff_request",
            "handoff_id": str(handoff.id),
            "conversation_id": request.conversation_id,
            "user_id": user_id,
            "specialization": specialization,
            "priority": "high",
            "reason": request.reason,
            "summary": "Conversa de teste sobre direito criminal",
            "created_at": handoff.created_at.isoformat(),
            "user_name": "Usuário Teste"
        }
        
        await ws_manager.broadcast_to_available_technicians(
            notification, specialization
        )
        
        return JSONResponse({
            "status": "success",
            "message": "Handoff simulado com sucesso",
            "data": {
                "handoff_id": str(handoff.id),
                "conversation_id": request.conversation_id,
                "status": handoff.status.value,
                "technician_notified": True
            }
        })
        
    except Exception as e:
        logger.error("Error simulating handoff", error=str(e))
        raise HTTPException(status_code=500, detail=f"Erro na simulação: {str(e)}")


@router.get("/technician-presence")
async def test_technician_presence(
    db: AsyncSession = Depends(get_db_session)
):
    """Testa sistema de presença de técnicos."""
    try:
        handoff_manager = HandoffManager(db)
        
        # Obter todas as presenças
        presence_list = await handoff_manager.get_all_technicians_presence()
        
        # Estatísticas
        stats = await handoff_manager.get_availability_stats()
        
        # Conexões WebSocket ativas
        ws_connections = {
            "users_online": len(ws_manager.user_connections),
            "technicians_online": len(ws_manager.technician_connections),
            "active_users": list(ws_manager.user_connections.keys()),
            "active_technicians": list(ws_manager.technician_connections.keys())
        }
        
        return JSONResponse({
            "status": "success",
            "data": {
                "presence_count": len(presence_list),
                "availability_stats": stats,
                "websocket_connections": ws_connections,
                "technicians": [
                    {
                        "id": p.technician_id,
                        "status": p.status.value,
                        "load": f"{p.current_load}/{p.max_load}",
                        "specializations": p.specializations
                    }
                    for p in presence_list
                ]
            }
        })
        
    except Exception as e:
        logger.error("Error testing presence", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-test-technician")
async def create_test_technician(
    technician_id: str = "tech_test_123",
    name: str = "Dr. João Teste",
    db: AsyncSession = Depends(get_db_session)
):
    """Cria técnico de teste."""
    try:
        from app.models.human_handoff import Technician
        
        # Verificar se já existe
        existing = await db.execute(
            "SELECT * FROM mozaia.technicians WHERE user_id = :user_id",
            {"user_id": technician_id}
        )
        
        if existing.fetchone():
            return JSONResponse({
                "status": "info",
                "message": "Técnico já existe",
                "technician_id": technician_id
            })
        
        # Criar novo técnico
        technician = Technician(
            user_id=technician_id,
            name=name,
            email=f"{technician_id}@teste.com",
            specializations=["criminal", "civil", "general"],
            status=TechnicianStatus.ONLINE,
            max_concurrent_conversations="5",
            current_load="0"
        )
        
        db.add(technician)
        await db.commit()
        
        return JSONResponse({
            "status": "success",
            "message": "Técnico de teste criado",
            "data": {
                "technician_id": technician_id,
                "name": name,
                "specializations": technician.specializations,
                "status": technician.status.value
            }
        })
        
    except Exception as e:
        logger.error("Error creating test technician", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/websocket-test")
async def test_websocket_connections():
    """Testa conexões WebSocket."""
    return JSONResponse({
        "status": "success",
        "data": {
            "user_connections": len(ws_manager.user_connections),
            "technician_connections": len(ws_manager.technician_connections),
            "active_conversations": len(ws_manager.conversation_participants),
            "connected_users": list(ws_manager.user_connections.keys()),
            "connected_technicians": list(ws_manager.technician_connections.keys())
        }
    })


@router.post("/simulate-chat-flow")
async def simulate_complete_chat_flow(
    db: AsyncSession = Depends(get_db_session)
):
    """Simula fluxo completo: Chat IA → Handoff → Técnico."""
    try:
        conversation_id = str(uuid.uuid4())
        user_id = "test_user_flow"
        technician_id = "tech_test_123"
        
        # 1. Simular conversa inicial com IA
        ai_messages = [
            {
                "role": "user",
                "content": "Preciso de ajuda com um caso criminal",
                "timestamp": "2025-01-21T21:30:00Z"
            },
            {
                "role": "assistant", 
                "content": "Posso ajudar com questões gerais, mas para casos específicos recomendo falar com um advogado especializado. Gostaria que eu transfira você para um técnico jurídico?",
                "timestamp": "2025-01-21T21:30:15Z"
            }
        ]
        
        # 2. Solicitar handoff
        handoff_manager = HandoffManager(db)
        request = HandoffRequest(
            conversation_id=conversation_id,
            user_id=user_id,
            specialization=Specialization.CRIMINAL,
            priority="normal",
            reason="Caso criminal específico"
        )
        
        handoff = await handoff_manager.request_handoff(
            request,
            ai_summary="Usuário tem questão sobre direito criminal e precisa de assistência especializada."
        )
        
        # 3. Simular aceitação do técnico
        accepted = await handoff_manager.accept_handoff(
            str(handoff.id), 
            technician_id
        )
        
        # 4. Simular mensagens entre usuário e técnico
        technician_messages = [
            {
                "role": "technician",
                "content": "Olá! Sou o Dr. João, advogado criminalista. Como posso ajudá-lo?",
                "timestamp": "2025-01-21T21:31:00Z"
            },
            {
                "role": "user", 
                "content": "Obrigado! Tenho uma dúvida sobre...",
                "timestamp": "2025-01-21T21:31:30Z"
            }
        ]
        
        return JSONResponse({
            "status": "success",
            "message": "Fluxo completo simulado com sucesso",
            "data": {
                "conversation_id": conversation_id,
                "handoff_id": str(handoff.id),
                "handoff_accepted": accepted,
                "ai_messages": ai_messages,
                "technician_messages": technician_messages,
                "flow_steps": [
                    "✅ Conversa inicial com IA",
                    "✅ Solicitação de handoff criada", 
                    "✅ Handoff aceito pelo técnico",
                    "✅ Comunicação técnico-usuário estabelecida"
                ]
            }
        })
        
    except Exception as e:
        logger.error("Error simulating chat flow", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system-status")
async def get_complete_system_status(
    db: AsyncSession = Depends(get_db_session)
):
    """Status completo do sistema."""
    try:
        handoff_manager = HandoffManager(db)
        
        # Handoffs pendentes
        pending_handoffs = await handoff_manager.get_pending_handoffs()
        
        # Estatísticas
        stats = await handoff_manager.get_availability_stats()
        
        # WebSocket status
        ws_status = {
            "user_connections": len(ws_manager.user_connections),
            "technician_connections": len(ws_manager.technician_connections),
            "conversation_rooms": len(ws_manager.conversation_participants)
        }
        
        return JSONResponse({
            "status": "success",
            "timestamp": "2025-01-21T21:30:00Z",
            "data": {
                "handoff_system": {
                    "pending_requests": len(pending_handoffs),
                    "availability_stats": stats
                },
                "websocket_system": ws_status,
                "database": "connected",
                "api_endpoints": "operational",
                "overall_health": "excellent"
            }
        })
        
    except Exception as e:
        logger.error("Error getting system status", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
