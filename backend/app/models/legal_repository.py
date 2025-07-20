"""Corrects the import and usage of Enum in the SQLAlchemy models."""
"""
Modelos para o repositório jurídico centralizado.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Boolean, JSON, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.models import Base, TimestampMixin


class DocumentType(str, PyEnum):
    """Tipos de documentos legais."""
    CONSTITUTION = "constitution"
    CODE = "code"
    LAW = "law"
    DECREE = "decree"
    REGULATION = "regulation"
    ORDINANCE = "ordinance"
    RESOLUTION = "resolution"
    CIRCULAR = "circular"


class DocumentStatus(str, PyEnum):
    """Status do documento legal."""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVOKED = "revoked"
    SUPERSEDED = "superseded"


class Jurisdiction(str, PyEnum):
    """Jurisdições legais."""
    MOZAMBIQUE = "mozambique"
    MAPUTO = "maputo"
    GAZA = "gaza"
    INHAMBANE = "inhambane"
    SOFALA = "sofala"
    MANICA = "manica"
    TETE = "tete"
    ZAMBEZE = "zambeze"
    NAMPULA = "nampula"
    CABO_DELGADO = "cabo_delgado"
    NIASSA = "niassa"


class Language(str, PyEnum):
    """Idiomas suportados."""
    PORTUGUESE = "pt"
    ENGLISH = "en"
    SHANGANA = "ts"
    SENA = "seh"
    NDAU = "ndc"
    MAKHUWA = "vmw"


class LegalDocument(Base, TimestampMixin):
    """Documento legal principal."""
    __tablename__ = 'legal_documents'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    official_number = Column(String(100))  # Número oficial da lei
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    jurisdiction = Column(SQLEnum(Jurisdiction), nullable=False)
    language = Column(SQLEnum(Language), default=Language.PORTUGUESE)

    # Datas importantes
    publication_date = Column(DateTime(timezone=True))
    effective_date = Column(DateTime(timezone=True))
    expiration_date = Column(DateTime(timezone=True))

    # Status e validação
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.PENDING)
    validated_by = Column(UUID(as_uuid=True))  # ID do profissional que validou
    validated_at = Column(DateTime(timezone=True))
    validation_notes = Column(Text)

    # Armazenamento
    storage_path = Column(String(1000))  # Caminho do documento original
    file_hash = Column(String(128))  # Hash para verificar integridade
    file_size = Column(String(20))
    mime_type = Column(String(100))

    # Metadados temáticos
    legal_areas = Column(JSON, default=list)  # ["civil", "penal", "laboral"]
    keywords = Column(JSON, default=list)
    summary = Column(Text)

    # Relacionamentos e versioning
    replaces_document_id = Column(UUID(as_uuid=True))  # Se substitui outra lei
    superseded_by_id = Column(UUID(as_uuid=True))  # Se foi substituída
    version = Column(String(20), default="1.0")

    # Upload info
    uploaded_by = Column(UUID(as_uuid=True), nullable=False)
    upload_notes = Column(Text)

    # Métricas de uso
    ai_query_count = Column(String, default="0")
    human_reference_count = Column(String, default="0")
    last_referenced_at = Column(DateTime(timezone=True))

    extra_data = Column(JSON, default=dict)

    # Relacionamentos
    articles = relationship("LegalArticle", back_populates="document", cascade="all, delete-orphan")
    validation_logs = relationship("DocumentValidationLog", back_populates="document")

    @property
    def is_active(self) -> bool:
        """Verifica se o documento está ativo para uso da IA."""
        return (
            self.status == DocumentStatus.APPROVED and
            (self.expiration_date is None or self.expiration_date > datetime.utcnow())
        )

    @property
    def can_be_referenced(self) -> bool:
        """Verifica se pode ser usado como referência pela IA."""
        return self.is_active and self.validated_by is not None

    def __repr__(self):
        return f"<LegalDocument(title='{self.title}', status='{self.status}')>"


class LegalArticle(Base, TimestampMixin):
    """Artigo individual de um documento legal."""
    __tablename__ = 'legal_articles'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.legal_documents.id'), nullable=False)

    # Estrutura do artigo
    article_number = Column(String(20))  # "1", "2-A", etc.
    chapter = Column(String(100))
    section = Column(String(100))
    subsection = Column(String(100))
    paragraph = Column(String(20))

    # Conteúdo
    original_text = Column(Text, nullable=False)
    normalized_text = Column(Text)  # Texto limpo para IA
    summary = Column(Text)

    # Indexação semântica
    semantic_tags = Column(JSON, default=list)
    legal_concepts = Column(JSON, default=list)
    references = Column(JSON, default=list)  # Referências a outros artigos

    # Métricas
    ai_query_count = Column(String, default="0")
    confidence_score = Column(String, default="0")  # Confiança da extração

    extra_data = Column(JSON, default=dict)

    # Relacionamentos
    document = relationship("LegalDocument", back_populates="articles")

    @property
    def full_reference(self) -> str:
        """Referência completa do artigo."""
        parts = []
        if self.chapter:
            parts.append(f"Cap. {self.chapter}")
        if self.section:
            parts.append(f"Sec. {self.section}")
        if self.article_number:
            parts.append(f"Art. {self.article_number}")
        if self.paragraph:
            parts.append(f"§{self.paragraph}")
        return " - ".join(parts) if parts else "Artigo"

    def __repr__(self):
        return f"<LegalArticle(document_id='{self.document_id}', article='{self.article_number}')>"


class DocumentValidationLog(Base, TimestampMixin):
    """Log de validações e alterações de status."""
    __tablename__ = 'document_validation_logs'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.legal_documents.id'), nullable=False)
    validator_id = Column(UUID(as_uuid=True), nullable=False)  # ID do profissional

    action = Column(String(50), nullable=False)  # "uploaded", "validated", "rejected", etc.
    previous_status = Column(String(50))
    new_status = Column(String(50), nullable=False)

    validation_criteria = Column(JSON, default=dict)  # Critérios checados
    issues_found = Column(JSON, default=list)  # Problemas identificados
    recommendations = Column(Text)
    notes = Column(Text)

    # Dados da sessão
    ip_address = Column(String(50))
    user_agent = Column(String(500))

    meta_data = Column(JSON, default=dict)

    # Relacionamentos
    document = relationship("LegalDocument", back_populates="validation_logs")

    def __repr__(self):
        return f"<DocumentValidationLog(action='{self.action}', document_id='{self.document_id}')>"


class LegalQuery(Base, TimestampMixin):
    """Log de consultas da IA ao repositório legal."""
    __tablename__ = 'legal_queries'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(String(100))  # ID da conversa original
    user_query = Column(Text, nullable=False)

    # Documentos encontrados
    matched_documents = Column(JSON, default=list)  # IDs dos documentos relevantes
    matched_articles = Column(JSON, default=list)  # IDs dos artigos citados
    confidence_scores = Column(JSON, default=dict)  # Scores de relevância

    # Resultado da consulta
    ai_response = Column(Text)
    escalated_to_human = Column(Boolean, default=False)
    escalation_reason = Column(String(200))

    # Métricas
    processing_time_ms = Column(String)
    search_method = Column(String(50))  # "semantic", "keyword", "hybrid"

    meta_data = Column(JSON, default=dict)

    def __repr__(self):
        return f"<LegalQuery(conversation_id='{self.conversation_id}', escalated='{self.escalated_to_human}')>"