# -*- coding: utf-8 -*-
"""
Schemas Pydantic para validação de dados.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class BaseResponse(BaseModel):
    """Resposta base para API."""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class ContextType(str, Enum):
    """Tipos de contexto suportados."""
    GENERAL = "general"
    LEGAL = "legal"
    TECHNICAL = "technical"
    BUSINESS = "business"
    ACADEMIC = "academic"


class GenerationParams(BaseModel):
    """Parâmetros para geração de texto."""
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(1000, ge=1, le=4000)
    top_p: Optional[float] = Field(0.9, ge=0.0, le=1.0)
    top_k: Optional[int] = Field(50, ge=1, le=100)
    frequency_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0)
    presence_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0)


class LLMResponse(BaseModel):
    """Resposta de um modelo LLM individual."""
    content: str = Field(alias="text")  # Use content as primary, text as alias
    text: Optional[str] = None  # Keep for backward compatibility
    model: str
    provider: str = "unknown"
    tokens_used: Optional[int] = 0
    processing_time: Optional[float] = 0.0
    cost: Optional[float] = 0.0
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator('content', pre=True)
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()
    
    @validator('text', pre=True, always=True)
    def set_text_from_content(cls, v, values):
        # Set text from content if not provided
        return v or values.get('content')


class ModelResponse(BaseModel):
    """Resposta individual de um modelo."""
    model_name: str
    response_text: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    processing_time: float
    tokens_used: int = 0
    cost: float = 0.0
    error: Optional[str] = None


class OrchestratorResponse(BaseModel):
    """Resposta final do orquestrador."""
    response: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_responses: List[ModelResponse]
    consensus_score: float = Field(..., ge=0.0, le=1.0)
    processing_time: float
    total_tokens: int = 0
    total_cost: float = 0.0
    requires_review: bool = False
    context_used: str
    metadata: Optional[Dict[str, Any]] = None


class ChatMessage(BaseModel):
    """Mensagem de chat."""
    id: str
    user_id: str
    content: str
    response: Optional[str] = None
    context: ContextType = ContextType.GENERAL
    confidence: Optional[float] = None
    models_used: Optional[List[str]] = None
    requires_review: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None


class ConversationSummary(BaseModel):
    """Resumo de uma conversa."""
    id: str
    user_id: str
    title: str
    message_count: int
    last_activity: datetime
    avg_confidence: float
    created_at: datetime


class HealthStatus(BaseModel):
    """Status de saúde da aplicação."""
    status: str
    timestamp: datetime
    version: str
    uptime: Optional[float] = None
    components: Dict[str, str]
    models_available: List[str]


class ModelStatus(BaseModel):
    """Status de um modelo específico."""
    name: str
    status: str  # "available", "unavailable", "error"
    last_check: datetime
    response_time: Optional[float] = None
    error_message: Optional[str] = None


class SystemMetrics(BaseModel):
    """Métricas do sistema."""
    requests_total: int
    requests_successful: int
    requests_failed: int
    avg_response_time: float
    models_status: List[ModelStatus]
    pool_stats: Dict[str, Any]
    uptime: float
    memory_usage: Optional[float] = None
    cpu_usage: Optional[float] = None
