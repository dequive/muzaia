from __future__ import annotations

"""
Sistema de gestão de transferência para técnicos jurídicos.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum
from dataclasses import dataclass
from sqlalchemy import Column, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.types import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.models import Base, TimestampMixin


class TechnicianStatus(str, Enum):
    """Status do técnico."""
    OFFLINE = "offline"
    ONLINE = "online"
    BUSY = "busy"
    AWAY = "away"


class HandoffStatus(str, Enum):
    """Status da transferência."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"
    TIMEOUT = "timeout"


class Specialization(str, Enum):
    """Especializações jurídicas."""
    GENERAL = "general"
    CRIMINAL = "criminal"
    CIVIL = "civil"
    LABOR = "labor"
    FAMILY = "family"
    COMMERCIAL = "commercial"
    TAX = "tax"
    ADMINISTRATIVE = "administrative"


class Technician(Base, TimestampMixin):
    """Modelo de técnico jurídico."""
    __tablename__ = 'technicians'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    specializations = Column(JSON, default=list)  # Lista de especializações
    status = Column(SQLEnum(TechnicianStatus), default=TechnicianStatus.OFFLINE)
    max_concurrent_conversations = Column(String, default="3")
    current_load = Column(String, default="0")
    last_activity = Column(DateTime(timezone=True), default=func.now())
    is_active = Column(Boolean, default=True)
    credentials = Column(JSON, default=dict)  # OAB, certificações, etc.
    meta_data = Column(JSON, default=dict)

    # Relacionamentos
    handoffs = relationship("ConversationHandoff", back_populates="technician")

    @property
    def is_available(self) -> bool:
        """Verifica se o técnico está disponível."""
        return (
            self.status == TechnicianStatus.ONLINE and
            int(self.current_load) < int(self.max_concurrent_conversations) and
            self.is_active
        )

    def __repr__(self):
        return f"<Technician(name='{self.name}', status='{self.status}')>"


class ConversationHandoff(Base, TimestampMixin):
    """Modelo de transferência de conversa."""
    __tablename__ = 'conversation_handoffs'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.conversations.id'), nullable=False)
    technician_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.technicians.id'), nullable=True)
    requested_by = Column(String(100), nullable=False)  # user_id
    status = Column(SQLEnum(HandoffStatus), default=HandoffStatus.PENDING)
    specialization_requested = Column(SQLEnum(Specialization), default=Specialization.GENERAL)
    priority = Column(String, default="normal")  # normal, high, urgent
    reason = Column(String(500))  # Motivo da transferência
    ai_summary = Column(String(2000))  # Resumo da conversa pela IA
    accepted_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    timeout_at = Column(DateTime(timezone=True))
    notes = Column(String(1000))  # Notas do técnico
    rating = Column(String)  # Avaliação do atendimento
    extra_data = Column(JSON, default=dict)

    # Relacionamentos
    conversation = relationship("Conversation")
    technician = relationship("Technician", back_populates="handoffs")

    def __repr__(self):
        return f"<ConversationHandoff(id='{self.id}', status='{self.status}')>"


@dataclass
class HandoffRequest:
    """Request para transferência de conversa."""
    conversation_id: str
    user_id: str
    specialization: Specialization = Specialization.GENERAL
    priority: str = "normal"
    reason: Optional[str] = None


@dataclass
class TechnicianPresence:
    """Informações de presença do técnico."""
    technician_id: str
    status: TechnicianStatus
    current_load: int
    max_load: int
    specializations: List[str]
    last_activity: datetime


class HandoffManager:
    """Gerenciador de transferências para técnicos."""

    def __init__(self, db_session):
        self.db = db_session
        self._presence_cache: Dict[str, TechnicianPresence] = {}

    async def request_handoff(
        self,
        request: HandoffRequest,
        ai_summary: Optional[str] = None
    ) -> ConversationHandoff:
        """Solicita transferência para técnico."""

        # Criar registro de transferência
        handoff = ConversationHandoff(
            conversation_id=request.conversation_id,
            requested_by=request.user_id,
            specialization_requested=request.specialization,
            priority=request.priority,
            reason=request.reason,
            ai_summary=ai_summary,
            timeout_at=datetime.utcnow() + timedelta(minutes=5)  # 5 min timeout
        )

        # Buscar técnico disponível
        available_technician = await self._find_available_technician(
            request.specialization
        )

        if available_technician:
            handoff.technician_id = available_technician.id
            handoff.status = HandoffStatus.PENDING
            # Aqui seria enviada notificação via WebSocket
        else:
            # Nenhum técnico disponível - agendar ou fila de espera
            handoff.status = HandoffStatus.PENDING

        self.db.add(handoff)
        await self.db.commit()

        return handoff

    async def accept_handoff(
        self,
        handoff_id: str,
        technician_id: str
    ) -> bool:
        """Técnico aceita a transferência."""

        handoff = await self.db.get(ConversationHandoff, handoff_id)
        if not handoff or handoff.status != HandoffStatus.PENDING:
            return False

        technician = await self.db.get(Technician, technician_id)
        if not technician or not technician.is_available:
            return False

        # Atualizar transferência
        handoff.technician_id = technician_id
        handoff.status = HandoffStatus.ACCEPTED
        handoff.accepted_at = datetime.utcnow()

        # Incrementar carga do técnico
        technician.current_load = str(int(technician.current_load) + 1)

        await self.db.commit()
        return True

    async def complete_handoff(
        self,
        handoff_id: str,
        notes: Optional[str] = None,
        rating: Optional[int] = None
    ) -> bool:
        """Completa a transferência."""

        handoff = await self.db.get(ConversationHandoff, handoff_id)
        if not handoff or handoff.status != HandoffStatus.ACCEPTED:
            return False

        # Atualizar transferência
        handoff.status = HandoffStatus.COMPLETED
        handoff.completed_at = datetime.utcnow()
        handoff.notes = notes
        handoff.rating = str(rating) if rating else None

        # Decrementar carga do técnico
        if handoff.technician:
            current_load = int(handoff.technician.current_load)
            handoff.technician.current_load = str(max(0, current_load - 1))

        await self.db.commit()
        return True

    async def _find_available_technician(
        self,
        specialization: Specialization
    ) -> Optional[Technician]:
        """Encontra técnico disponível com especialização."""

        # Query técnicos disponíveis
        technicians = await self.db.execute(
            """
            SELECT * FROM mozaia.technicians 
            WHERE status = 'online' 
            AND is_active = true
            AND CAST(current_load AS INTEGER) < CAST(max_concurrent_conversations AS INTEGER)
            ORDER BY CAST(current_load AS INTEGER) ASC, last_activity DESC
            """
        )

        for tech in technicians:
            tech_specializations = tech.specializations or []
            if (specialization.value in tech_specializations or 
                Specialization.GENERAL.value in tech_specializations):
                return tech

        return None

    async def update_technician_presence(
        self,
        technician_id: str,
        status: TechnicianStatus
    ) -> bool:
        """Atualiza presença do técnico."""

        technician = await self.db.get(Technician, technician_id)
        if not technician:
            return False

        technician.status = status
        technician.last_activity = datetime.utcnow()

        await self.db.commit()
        return True

    async def get_pending_handoffs(
        self,
        technician_id: Optional[str] = None
    ) -> List[ConversationHandoff]:
        """Lista transferências pendentes."""

        query = """
        SELECT * FROM mozaia.conversation_handoffs 
        WHERE status = 'pending'
        """
        params = {}

        if technician_id:
            query += " AND (technician_id = :technician_id OR technician_id IS NULL)"
            params['technician_id'] = technician_id

        query += " ORDER BY priority DESC, created_at ASC"

        result = await self.db.execute(query, params)
        return result.fetchall()