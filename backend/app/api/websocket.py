
"""
WebSocket Manager para comunicação em tempo real IA ↔ Técnico ↔ Usuario.
"""
import json
import uuid
from typing import Dict, List, Optional, Set
from fastapi import WebSocket, WebSocketDisconnect, Depends
from fastapi.routing import APIRouter
from datetime import datetime
import structlog

from app.models.human_handoff import HandoffManager, TechnicianStatus
from app.database.connection import get_db_session

logger = structlog.get_logger(__name__)

router = APIRouter()


class ConnectionType:
    USER = "user"
    TECHNICIAN = "technician"
    ADMIN = "admin"


class WebSocketManager:
    """Gerenciador de conexões WebSocket para chat em tempo real."""
    
    def __init__(self):
        # Conexões ativas por tipo
        self.user_connections: Dict[str, WebSocket] = {}
        self.technician_connections: Dict[str, WebSocket] = {}
        self.admin_connections: Dict[str, WebSocket] = {}
        
        # Mapeamento conversa -> participantes
        self.conversation_participants: Dict[str, Set[str]] = {}
        
        # Rooms para broadcasts específicos
        self.rooms: Dict[str, Set[WebSocket]] = {}

    async def connect_user(self, websocket: WebSocket, user_id: str):
        """Conecta usuário ao WebSocket."""
        await websocket.accept()
        self.user_connections[user_id] = websocket
        logger.info("User connected", user_id=user_id)
        
        # Notificar status online
        await self.broadcast_user_status(user_id, "online")

    async def connect_technician(self, websocket: WebSocket, technician_id: str):
        """Conecta técnico ao WebSocket."""
        await websocket.accept()
        self.technician_connections[technician_id] = websocket
        logger.info("Technician connected", technician_id=technician_id)
        
        # Atualizar status no BD
        async with get_db_session() as db:
            handoff_manager = HandoffManager(db)
            await handoff_manager.update_technician_presence(
                technician_id, TechnicianStatus.ONLINE
            )

    def disconnect_user(self, user_id: str):
        """Desconecta usuário."""
        if user_id in self.user_connections:
            del self.user_connections[user_id]
            logger.info("User disconnected", user_id=user_id)

    async def disconnect_technician(self, technician_id: str):
        """Desconecta técnico."""
        if technician_id in self.technician_connections:
            del self.technician_connections[technician_id]
            logger.info("Technician disconnected", technician_id=technician_id)
            
            # Atualizar status no BD
            async with get_db_session() as db:
                handoff_manager = HandoffManager(db)
                await handoff_manager.update_technician_presence(
                    technician_id, TechnicianStatus.OFFLINE
                )

    async def send_to_user(self, user_id: str, message: dict):
        """Envia mensagem para usuário específico."""
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error("Failed to send message to user", 
                           user_id=user_id, error=str(e))
                self.disconnect_user(user_id)

    async def send_to_technician(self, technician_id: str, message: dict):
        """Envia mensagem para técnico específico."""
        if technician_id in self.technician_connections:
            websocket = self.technician_connections[technician_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error("Failed to send message to technician", 
                           technician_id=technician_id, error=str(e))
                await self.disconnect_technician(technician_id)

    async def broadcast_to_conversation(self, conversation_id: str, message: dict):
        """Envia mensagem para todos os participantes de uma conversa."""
        participants = self.conversation_participants.get(conversation_id, set())
        
        for participant_id in participants:
            # Tentar enviar para usuário
            if participant_id in self.user_connections:
                await self.send_to_user(participant_id, message)
            
            # Tentar enviar para técnico
            if participant_id in self.technician_connections:
                await self.send_to_technician(participant_id, message)

    async def join_conversation(self, conversation_id: str, participant_id: str):
        """Adiciona participante à conversa."""
        if conversation_id not in self.conversation_participants:
            self.conversation_participants[conversation_id] = set()
        
        self.conversation_participants[conversation_id].add(participant_id)
        
        # Notificar outros participantes
        await self.broadcast_to_conversation(conversation_id, {
            "type": "participant_joined",
            "conversation_id": conversation_id,
            "participant_id": participant_id,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def leave_conversation(self, conversation_id: str, participant_id: str):
        """Remove participante da conversa."""
        if conversation_id in self.conversation_participants:
            self.conversation_participants[conversation_id].discard(participant_id)
            
            # Notificar outros participantes
            await self.broadcast_to_conversation(conversation_id, {
                "type": "participant_left",
                "conversation_id": conversation_id,
                "participant_id": participant_id,
                "timestamp": datetime.utcnow().isoformat()
            })

    async def broadcast_to_available_technicians(
        self, 
        message: dict, 
        specialization: Optional[str] = None
    ):
        """Envia mensagem para técnicos disponíveis."""
        async with get_db_session() as db:
            handoff_manager = HandoffManager(db)
            available_techs = await handoff_manager._find_available_technician(
                specialization
            )
            
            for tech_id in self.technician_connections:
                await self.send_to_technician(tech_id, message)

    async def broadcast_user_status(self, user_id: str, status: str):
        """Broadcast status do usuário."""
        message = {
            "type": "user_status_change",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Enviar para admins e técnicos conectados
        for admin_ws in self.admin_connections.values():
            try:
                await admin_ws.send_text(json.dumps(message))
            except:
                pass

    def get_online_users(self) -> List[str]:
        """Retorna lista de usuários online."""
        return list(self.user_connections.keys())

    def get_online_technicians(self) -> List[str]:
        """Retorna lista de técnicos online."""
        return list(self.technician_connections.keys())


# Instância global do manager
manager = WebSocketManager()


@router.websocket("/ws/user/{user_id}")
async def websocket_user_endpoint(websocket: WebSocket, user_id: str):
    """Endpoint WebSocket para usuários."""
    await manager.connect_user(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Processar mensagem do usuário
            await handle_user_message(user_id, message)
            
    except WebSocketDisconnect:
        manager.disconnect_user(user_id)
    except Exception as e:
        logger.error("WebSocket user error", user_id=user_id, error=str(e))
        manager.disconnect_user(user_id)


@router.websocket("/ws/technician/{technician_id}")
async def websocket_technician_endpoint(websocket: WebSocket, technician_id: str):
    """Endpoint WebSocket para técnicos."""
    await manager.connect_technician(websocket, technician_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Processar mensagem do técnico
            await handle_technician_message(technician_id, message)
            
    except WebSocketDisconnect:
        await manager.disconnect_technician(technician_id)
    except Exception as e:
        logger.error("WebSocket technician error", 
                    technician_id=technician_id, error=str(e))
        await manager.disconnect_technician(technician_id)


async def handle_user_message(user_id: str, message: dict):
    """Processa mensagens recebidas do usuário."""
    message_type = message.get("type")
    
    if message_type == "chat_message":
        conversation_id = message.get("conversation_id")
        content = message.get("content")
        
        # Broadcast para participantes da conversa
        await manager.broadcast_to_conversation(conversation_id, {
            "type": "new_message",
            "sender_type": "user",
            "sender_id": user_id,
            "content": content,
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    elif message_type == "join_conversation":
        conversation_id = message.get("conversation_id")
        await manager.join_conversation(conversation_id, user_id)
    
    elif message_type == "typing":
        conversation_id = message.get("conversation_id")
        await manager.broadcast_to_conversation(conversation_id, {
            "type": "typing_indicator",
            "sender_type": "user",
            "sender_id": user_id,
            "conversation_id": conversation_id,
            "is_typing": message.get("is_typing", True)
        })


async def handle_technician_message(technician_id: str, message: dict):
    """Processa mensagens recebidas do técnico."""
    message_type = message.get("type")
    
    if message_type == "chat_message":
        conversation_id = message.get("conversation_id")
        content = message.get("content")
        
        # Broadcast para participantes da conversa
        await manager.broadcast_to_conversation(conversation_id, {
            "type": "new_message",
            "sender_type": "technician",
            "sender_id": technician_id,
            "content": content,
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    elif message_type == "accept_handoff":
        handoff_id = message.get("handoff_id")
        conversation_id = message.get("conversation_id")
        
        # Processar aceitação do handoff
        async with get_db_session() as db:
            handoff_manager = HandoffManager(db)
            success = await handoff_manager.accept_handoff(handoff_id, technician_id)
            
            if success:
                # Notificar usuário
                user_id = message.get("user_id")
                if user_id:
                    await manager.send_to_user(user_id, {
                        "type": "handoff_accepted",
                        "technician_id": technician_id,
                        "conversation_id": conversation_id,
                        "handoff_id": handoff_id
                    })
                
                # Adicionar técnico à conversa
                await manager.join_conversation(conversation_id, technician_id)
    
    elif message_type == "join_conversation":
        conversation_id = message.get("conversation_id")
        await manager.join_conversation(conversation_id, technician_id)
