# -*- coding: utf-8 -*-
"""
Modelos SQLAlchemy para o banco de dados.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Text, Integer, Decimal, Boolean, DateTime, 
    ForeignKey, JSON, ARRAY, Index, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ENUM, INET
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

Base = declarative_base()

# Enums
ContextTypeEnum = ENUM(
    'general', 'legal', 'technical', 'business', 'academic',
    name='context_type'
)

ConversationStatusEnum = ENUM(
    'active', 'completed', 'requires_review', 'archived',
    name='conversation_status'
)

FeedbackTypeEnum = ENUM(
    'helpful', 'not_helpful', 'incorrect', 'incomplete', 'inappropriate',
    name='feedback_type'
)


class TimestampMixin:
    """Mixin para campos de timestamp."""
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())


class User(Base, TimestampMixin):
    """Modelo de usuário."""
    __tablename__ = 'users'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255))
    first_name = Column(String(100))
    last_name = Column(String(100))
    language_preference = Column(String(10), default='pt-MZ')
    last_active = Column(DateTime(timezone=True), default=func.now())
    is_active = Column(Boolean, default=True)
    metadata = Column(JSON, default=dict)

    # Relacionamentos
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")

    @validates('email')
    def validate_email(self, key, email):
        if email and '@' not in email:
            raise ValueError("Email inválido")
        return email

    def __repr__(self):
        return f"<User(user_id='{self.user_id}', email='{self.email}')>"


class Conversation(Base, TimestampMixin):
    """Modelo de conversa."""
    __tablename__ = 'conversations'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), ForeignKey('mozaia.users.user_id', ondelete='CASCADE'), nullable=False)
    session_id = Column(UUID(as_uuid=True), default=uuid.uuid4)
    title = Column(String(500))
    context = Column(ContextTypeEnum, default='general')
    status = Column(ConversationStatusEnum, default='active')
    message_count = Column(Integer, default=0)
    avg_confidence = Column(Decimal(3, 2))
    total_tokens = Column(Integer, default=0)
    total_cost = Column(Decimal(10, 6), default=0.00)
    requires_review = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    metadata = Column(JSON, default=dict)

    # Relacionamentos
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    # Índices
    __table_args__ = (
        Index('idx_conversations_user_id', 'user_id'),
        Index('idx_conversations_context', 'context'),
        Index('idx_conversations_status', 'status'),
        {'schema': 'mozaia'}
    )

    def __repr__(self):
        return f"<Conversation(id='{self.id}', user_id='{self.user_id}', status='{self.status}')>"


class Message(Base, TimestampMixin):
    """Modelo de mensagem."""
    __tablename__ = 'messages'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.conversations.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(100), ForeignKey('mozaia.users.user_id', ondelete='CASCADE'), nullable=False)
    message_text = Column(Text, nullable=False)
    response_text = Column(Text)
    context = Column(ContextTypeEnum, default='general')
    confidence_score = Column(Decimal(3, 2))
    consensus_score = Column(Decimal(3, 2))
    models_used = Column(ARRAY(String))
    processing_time = Column(Decimal(8, 3))
    tokens_used = Column(Integer, default=0)
    cost = Column(Decimal(10, 6), default=0.00)
    requires_review = Column(Boolean, default=False)
    is_streamed = Column(Boolean, default=False)
    metadata = Column(JSON, default=dict)

    # Relacionamentos
    conversation = relationship("Conversation", back_populates="messages")
    user = relationship("User", back_populates="messages")
    model_responses = relationship("ModelResponse", back_populates="message", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="message", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('LENGTH(message_text) >= 1', name='message_text_not_empty'),
        CheckConstraint('confidence_score >= 0.0 AND confidence_score <= 1.0', name='valid_confidence'),
        Index('idx_messages_conversation_id', 'conversation_id'),
        Index('idx_messages_user_id', 'user_id'),
        Index('idx_messages_context', 'context'),
        {'schema': 'mozaia'}
    )

    @validates('message_text')
    def validate_message_text(self, key, text):
        if not text or len(text.strip()) == 0:
            raise ValueError("Texto da mensagem não pode estar vazio")
        return text

    def __repr__(self):
        return f"<Message(id='{self.id}', user_id='{self.user_id}', confidence={self.confidence_score})>"


class ModelResponse(Base):
    """Modelo de resposta individual de modelo LLM."""
    __tablename__ = 'model_responses'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.messages.id', ondelete='CASCADE'), nullable=False)
    model_name = Column(String(100), nullable=False)
    response_text = Column(Text, nullable=False)
    confidence = Column(Decimal(3, 2))
    processing_time = Column(Decimal(8, 3))
    tokens_used = Column(Integer, default=0)
    cost = Column(Decimal(10, 6), default=0.00)
    error_message = Column(Text)
    is_outlier = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    metadata = Column(JSON, default=dict)

    # Relacionamentos
    message = relationship("Message", back_populates="model_responses")

    # Índices
    __table_args__ = (
        Index('idx_model_responses_message_id', 'message_id'),
        Index('idx_model_responses_model_name', 'model_name'),
        {'schema': 'mozaia'}
    )

    def __repr__(self):
        return f"<ModelResponse(model='{self.model_name}', confidence={self.confidence})>"


class Feedback(Base):
    """Modelo de feedback do usuário."""
    __tablename__ = 'feedback'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('mozaia.messages.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(100), ForeignKey('mozaia.users.user_id', ondelete='CASCADE'), nullable=False)
    feedback_type = Column(FeedbackTypeEnum, nullable=False)
    rating = Column(Integer, CheckConstraint('rating >= 1 AND rating <= 5'))
    comment = Column(Text)
    is_helpful = Column(Boolean)
    created_at = Column(DateTime(timezone=True), default=func.now())
    metadata = Column(JSON, default=dict)

    # Relacionamentos
    message = relationship("Message", back_populates="feedback")
    user = relationship("User", back_populates="feedback")

    # Constraints
    __table_args__ = (
        CheckConstraint('rating IS NULL OR (rating >= 1 AND rating <= 5)', name='valid_rating'),
        Index('idx_feedback_message_id', 'message_id'),
        Index('idx_feedback_user_id', 'user_id'),
        Index('idx_feedback_type', 'feedback_type'),
        {'schema': 'mozaia'}
    )

    def __repr__(self):
        return f"<Feedback(type='{self.feedback_type}', rating={self.rating})>"


class SystemMetric(Base):
    """Modelo de métricas do sistema."""
    __tablename__ = 'system_metrics'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Decimal(15, 6))
    metric_data = Column(JSON)
    recorded_at = Column(DateTime(timezone=True), default=func.now())

    # Índices
    __table_args__ = (
        Index('idx_system_metrics_name', 'metric_name'),
        Index('idx_system_metrics_recorded_at', 'recorded_at'),
        Index('idx_system_metrics_name_date', 'metric_name', 'recorded_at'),
        {'schema': 'mozaia'}
    )

    def __repr__(self):
        return f"<SystemMetric(name='{self.metric_name}', value={self.metric_value})>"


class AuditLog(Base):
    """Modelo de log de auditoria."""
    __tablename__ = 'audit_logs'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100))
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(UUID(as_uuid=True))
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now())
    metadata = Column(JSON, default=dict)

    # Índices
    __table_args__ = (
        Index('idx_audit_logs_user_id', 'user_id'),
        Index('idx_audit_logs_action', 'action'),
        Index('idx_audit_logs_created_at', 'created_at'),
        {'schema': 'mozaia'}
    )

    def __repr__(self):
        return f"<AuditLog(action='{self.action}', user_id='{self.user_id}')>"


class SystemConfig(Base, TimestampMixin):
    """Modelo de configuração do sistema."""
    __tablename__ = 'system_config'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(JSON, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<SystemConfig(key='{self.config_key}', active={self.is_active})>"


class ResponseCache(Base):
    """Modelo de cache de respostas."""
    __tablename__ = 'response_cache'
    __table_args__ = {'schema': 'mozaia'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cache_key = Column(String(255), unique=True, nullable=False)
    query_hash = Column(String(64), nullable=False)
    response_data = Column(JSON, nullable=False)
    confidence_score = Column(Decimal(3, 2))
    models_used = Column(ARRAY(String))
    created_at = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(DateTime(timezone=True))
    hit_count = Column(Integer, default=0)
    last_accessed = Column(DateTime(timezone=True), default=func.now())

    # Índices
    __table_args__ = (
        Index('idx_response_cache_key', 'cache_key'),
        Index('idx_response_cache_hash', 'query_hash'),
        Index('idx_response_cache_expires', 'expires_at'),
        {'schema': 'mozaia'}
    )

    def __repr__(self):
        return f"<ResponseCache(key='{self.cache_key}', hits={self.hit_count})>"
