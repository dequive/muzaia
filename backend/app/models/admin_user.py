
"""
Modelo para administradores e gestão de utilizadores profissionais.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlalchemy import Column, String, DateTime, Boolean, JSON, Text, ENUM
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash, check_password_hash

from app.database.models import Base, TimestampMixin


class UserRole(str, Enum):
    """Roles de utilizador no sistema."""
    COMMON = "common"
    STAFF = "staff"
    LEGAL_TECH = "legal_tech"
    LAWYER = "lawyer"
    ADMIN = "admin"


class UserStatus(str, Enum):
    """Status de utilizador."""
    PENDING = "pending"
    APPROVED = "approved"
    BLOCKED = "blocked"
    SUSPENDED = "suspended"


class LegalSpecialization(str, Enum):
    """Especializações jurídicas detalhadas."""
    GENERAL = "general"
    CRIMINAL = "criminal"
    CIVIL = "civil"
    LABOR = "labor"
    FAMILY = "family"
    COMMERCIAL = "commercial"
    TAX = "tax"
    ADMINISTRATIVE = "administrative"
    CONSTITUTIONAL = "constitutional"
    INTERNATIONAL = "international"
    ENVIRONMENTAL = "environmental"
    INTELLECTUAL_PROPERTY = "intellectual_property"


class ProfessionalUser(Base, TimestampMixin):
    """Modelo para utilizadores profissionais (técnicos e advogados)."""
    __tablename__ = 'professional_users'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(ENUM(UserRole), default=UserRole.LEGAL_TECH)
    status = Column(ENUM(UserStatus), default=UserStatus.PENDING)
    
    # Informações profissionais
    specializations = Column(JSON, default=list)  # Lista de especializações
    jurisdiction = Column(String(100))  # País/estado de atuação
    license_number = Column(String(100))  # Número da OAB/ordem
    license_document_path = Column(String(500))  # Caminho para documento
    professional_email = Column(String(255))  # Email profissional
    phone = Column(String(50))
    
    # Controle administrativo
    approved_by = Column(UUID(as_uuid=True))  # ID do admin que aprovou
    approved_at = Column(DateTime(timezone=True))
    last_active_at = Column(DateTime(timezone=True), default=func.now())
    login_attempts = Column(String, default="0")
    is_two_factor_enabled = Column(Boolean, default=False)
    
    # Documentação e notas
    notes = Column(Text)  # Notas administrativas
    uploaded_documents = Column(JSON, default=list)  # Lista de documentos
    verification_notes = Column(Text)  # Notas da verificação
    
    # Métricas de performance
    total_conversations = Column(String, default="0")
    average_response_time = Column(String, default="0")
    user_rating = Column(String, default="0")
    
    metadata = Column(JSON, default=dict)

    def set_password(self, password: str) -> None:
        """Define senha com hash seguro."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifica senha."""
        return check_password_hash(self.password_hash, password)

    @property
    def is_approved(self) -> bool:
        """Verifica se o utilizador está aprovado."""
        return self.status == UserStatus.APPROVED

    @property
    def can_login(self) -> bool:
        """Verifica se pode fazer login."""
        return self.status in [UserStatus.APPROVED] and int(self.login_attempts) < 5

    def __repr__(self):
        return f"<ProfessionalUser(email='{self.email}', role='{self.role}', status='{self.status}')>"


class AdminUser(Base, TimestampMixin):
    """Modelo para administradores do sistema."""
    __tablename__ = 'admin_users'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(ENUM(UserRole), default=UserRole.ADMIN)
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, default=False)
    
    # Controle de acesso
    last_login_at = Column(DateTime(timezone=True))
    login_ip = Column(String(50))
    failed_login_attempts = Column(String, default="0")
    is_two_factor_enabled = Column(Boolean, default=True)
    
    # Permissões específicas
    permissions = Column(JSON, default=list)  # Lista de permissões específicas
    accessible_features = Column(JSON, default=list)
    
    metadata = Column(JSON, default=dict)

    def set_password(self, password: str) -> None:
        """Define senha com hash seguro."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifica senha."""
        return check_password_hash(self.password_hash, password)

    @property
    def can_approve_professionals(self) -> bool:
        """Verifica se pode aprovar profissionais."""
        return self.is_active and ('approve_professionals' in self.permissions or self.is_super_admin)

    def __repr__(self):
        return f"<AdminUser(email='{self.email}', role='{self.role}')>"


class ProfessionalApprovalLog(Base, TimestampMixin):
    """Log de aprovações de profissionais."""
    __tablename__ = 'professional_approval_logs'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    professional_user_id = Column(UUID(as_uuid=True), nullable=False)
    admin_user_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String(50), nullable=False)  # approved, rejected, suspended
    reason = Column(Text)
    previous_status = Column(String(50))
    new_status = Column(String(50))
    documents_reviewed = Column(JSON, default=list)
    notes = Column(Text)
    
    metadata = Column(JSON, default=dict)

    def __repr__(self):
        return f"<ProfessionalApprovalLog(action='{self.action}', professional='{self.professional_user_id}')>"
