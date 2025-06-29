# -*- coding: utf-8 -*-
"""
Módulo de banco de dados.

Contém modelos SQLAlchemy, gerenciamento de conexão
e utilitários para persistência de dados.
"""

from .connection import db_manager, DatabaseManager
from .models import (
    Base,
    User,
    Conversation, 
    Message,
    ModelResponse,
    Feedback,
    SystemMetric,
    AuditLog,
    SystemConfig,
    ResponseCache,
    # Enums
    ContextTypeEnum,
    ConversationStatusEnum,
    FeedbackTypeEnum,
    # Mixins
    TimestampMixin,
)

# Utilitários de consulta
def get_session():
    """Obtém sessão do banco de dados."""
    return db_manager.get_session()

async def init_database():
    """Inicializa conexão com banco de dados."""
    await db_manager.initialize()

async def close_database():
    """Fecha conexão com banco de dados."""
    await db_manager.close()

# Mapeamento de modelos por nome
MODEL_REGISTRY = {
    "user": User,
    "conversation": Conversation,
    "message": Message,
    "model_response": ModelResponse,
    "feedback": Feedback,
    "system_metric": SystemMetric,
    "audit_log": AuditLog,
    "system_config": SystemConfig,
    "response_cache": ResponseCache,
}

def get_model_class(model_name: str):
    """
    Obtém classe do modelo pelo nome.
    
    Args:
        model_name: Nome do modelo
        
    Returns:
        Classe do modelo ou None
    """
    return MODEL_REGISTRY.get(model_name.lower())

__all__ = [
    # Gerenciamento de conexão
    "db_manager",
    "DatabaseManager",
    "get_session",
    "init_database", 
    "close_database",
    
    # Base e modelos
    "Base",
    "User",
    "Conversation",
    "Message", 
    "ModelResponse",
    "Feedback",
    "SystemMetric",
    "AuditLog",
    "SystemConfig",
    "ResponseCache",
    
    # Enums
    "ContextTypeEnum",
    "ConversationStatusEnum", 
    "FeedbackTypeEnum",
    
    # Mixins
    "TimestampMixin",
    
    # Utilitários
    "MODEL_REGISTRY",
    "get_model_class",
]
