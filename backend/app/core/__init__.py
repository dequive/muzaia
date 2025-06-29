# -*- coding: utf-8 -*-
"""
Módulo core da aplicação Mozaia.

Contém os componentes principais do sistema:
- Configurações centralizadas
- Orquestrador de LLMs
- Factory e Pool de modelos
- Motor de consenso
- Protocolos e interfaces
- Resiliência e recuperação
"""

from .config import settings
from .orchestrator import LLMOrchestrator
from .factory import LLMFactory
from .pool import LLMPool, PoolConfig
from .consensus_engine import ConsensusEngine
from .resilience import (
    CircuitBreaker,
    CircuitBreakerConfig,
    RateLimiter,
    RateLimiterConfig,
    RetryConfig,
    ResilienceManager,
    resilience_manager,
    retry_with_backoff,
)
from .protocols import (
    AbstractLLM,
    AbstractLLMFactory,
    AbstractLLMPool,
    AbstractConsensusEngine,
    AbstractOrchestrator,
    LLMError,
    LLMConnectionError,
    LLMTimeoutError,
    LLMRateLimitError,
    LLMInvalidResponseError,
)
from .exceptions import (
    MozaiaError,
    InvalidInputError,
    LLMServiceError,
    ConsensusError,
    ValidationError,
    DatabaseError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    CircuitBreakerError,
    RetryExhaustedError,
)

# Exports principais
__all__ = [
    # Configurações
    "settings",
    
    # Componentes principais
    "LLMOrchestrator",
    "LLMFactory", 
    "LLMPool",
    "PoolConfig",
    "ConsensusEngine",
    
    # Resiliência
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "RateLimiter",
    "RateLimiterConfig",
    "RetryConfig",
    "ResilienceManager",
    "resilience_manager",
    "retry_with_backoff",
    
    # Protocolos e interfaces
    "AbstractLLM",
    "AbstractLLMFactory",
    "AbstractLLMPool", 
    "AbstractConsensusEngine",
    "AbstractOrchestrator",
    
    # Exceções do protocolo
    "LLMError",
    "LLMConnectionError",
    "LLMTimeoutError", 
    "LLMRateLimitError",
    "LLMInvalidResponseError",
    
    # Exceções da aplicação
    "MozaiaError",
    "InvalidInputError",
    "LLMServiceError",
    "ConsensusError", 
    "ValidationError",
    "DatabaseError",
    "AuthenticationError",
    "AuthorizationError",
    "RateLimitError",
    "CircuitBreakerError",
    "RetryExhaustedError",
]

# Informações do módulo
__version__ = "2.0.0"
__author__ = "Mozaia Team"
