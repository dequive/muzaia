
"""
Sistema de gestão de técnicos jurídicos com validação e aprovação.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlalchemy import Column, String, DateTime, Boolean, JSON, Text, ForeignKey
from sqlalchemy.types import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.models import Base, TimestampMixin


class UserRole(str, Enum):
    """Roles de usuário no sistema."""
    COMMON = "common"           # Usuário final
    LEGAL_TECH = "legal_tech"   # Técnico jurídico
    LAWYER = "lawyer"           # Advogado
    STAFF = "staff"             # Staff administrativo
    ADMIN = "admin"             # Administrador


class ProfessionalStatus(str, Enum):
    """Status do profissional jurídico."""
    PENDING = "pending"         # Aguardando aprovação
    APPROVED = "approved"       # Aprovado e ativo
    REJECTED = "rejected"       # Rejeitado
    SUSPENDED = "suspended"     # Suspenso temporariamente
    BLOCKED = "blocked"         # Bloqueado permanentemente


class LegalSpecialty(str, Enum):
    """Especialidades jurídicas."""
    GENERAL = "general"
    CRIMINAL = "criminal"
    CIVIL = "civil"
    LABOR = "labor"
    FAMILY = "family"
    COMMERCIAL = "commercial"
    TAX = "tax"
    ADMINISTRATIVE = "administrative"
    CONSTITUTIONAL = "constitutional"
    ENVIRONMENTAL = "environmental"


class Jurisdiction(str, Enum):
    """Jurisdições."""
    PORTUGAL = "portugal"
    BRAZIL = "brazil"
    ANGOLA = "angola"
    MOZAMBIQUE = "mozambique"
    OTHER = "other"


class LegalProfessional(Base, TimestampMixin):
    """Modelo para profissionais jurídicos (advogados e técnicos)."""
    __tablename__ = 'legal_professionals'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Informações pessoais
    full_name = Column(String(300), nullable=False)
    phone = Column(String(50))
    
    # Informações profissionais
    role = Column(SQLEnum(UserRole), nullable=False)
    status = Column(SQLEnum(ProfessionalStatus), default=ProfessionalStatus.PENDING)
    specialties = Column(JSON, default=list)  # Lista de especialidades
    jurisdiction = Column(SQLEnum(Jurisdiction), nullable=False)
    
    # Documentação e licenças
    license_number = Column(String(100))  # Número da OAB, etc.
    license_document_path = Column(String(500))  # Caminho para documento
    professional_bio = Column(Text)
    
    # Controle administrativo
    approved_by = Column(UUID(as_uuid=True), ForeignKey('mozaia.legal_professionals.id'))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    
    # Status de atividade
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True))
    last_activity_at = Column(DateTime(timezone=True))
    
    # Configurações
    max_concurrent_cases = Column(String, default="3")
    current_load = Column(String, default="0")
    notification_preferences = Column(JSON, default=dict)
    
    # Métricas
    total_cases_handled = Column(String, default="0")
    average_rating = Column(String, default="0")
    meta_data = Column(JSON, default=dict)

    # Relacionamentos
    approved_by_user = relationship("LegalProfessional", remote_side=[id])
    approval_logs = relationship("ProfessionalApprovalLog", back_populates="professional")

    @property
    def is_available_for_cases(self) -> bool:
        """Verifica se o profissional está disponível para novos casos."""
        return (
            self.status == ProfessionalStatus.APPROVED and
            self.is_active and
            int(self.current_load) < int(self.max_concurrent_cases)
        )

    def __repr__(self):
        return f"<LegalProfessional(name='{self.full_name}', role='{self.role}', status='{self.status}')>"


class ProfessionalApprovalLog(Base, TimestampMixin):
    """Log de aprovações e alterações de status."""
    __tablename__ = 'professional_approval_logs'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    professional_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.legal_professionals.id'), nullable=False)
    admin_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.legal_professionals.id'), nullable=False)
    
    action = Column(String(50), nullable=False)  # 'approved', 'rejected', 'suspended', etc.
    previous_status = Column(String(50))
    new_status = Column(String(50))
    reason = Column(Text)
    admin_notes = Column(Text)
    
    # Relacionamentos
    professional = relationship("LegalProfessional", foreign_keys=[professional_id])
    admin = relationship("LegalProfessional", foreign_keys=[admin_id])

    def __repr__(self):
        return f"<ApprovalLog(action='{self.action}', status='{self.new_status}')>"


class ProfessionalSession(Base, TimestampMixin):
    """Sessões ativas dos profissionais."""
    __tablename__ = 'professional_sessions'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    professional_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.legal_professionals.id'), nullable=False)
    session_token = Column(String(500), unique=True, nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relacionamentos
    professional = relationship("LegalProfessional")

    def __repr__(self):
        return f"<ProfessionalSession(professional_id='{self.professional_id}', active='{self.is_active}')>"
