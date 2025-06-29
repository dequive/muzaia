# -*- coding: utf-8 -*-
"""
Módulo core da aplicação Muzaia.

Contém os componentes principais do sistema:
- Configurações centralizadas
- Orquestrador de LLMs
- Factory e Pool de modelos
- Motor de consenso
- Protocolos e interfaces
- Resiliência e recuperação
- Cache assíncrono em memória
"""

from .config import settings
from .orchestrator import LLMOrchestrator
from .factory import LLMFactory
from .pool import LLMPool, PoolConfig
from .consensus_engine import HybridConsensusEngine as ConsensusEngine
from .consensus import SemanticConsensusEngine
from .cache import (
    AsyncInMemoryCache,
    EvictionPolicy,
    CacheStats,
    global_cache,
    cache_result,
)
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
    LLMRateLimitError,
    LLMInvalidResponseError,
)
from .exceptions import (
    MuzaiaError,
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
    LLMTimeoutError,
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
    "SemanticConsensusEngine",
    
    # Cache
    "AsyncInMemoryCache",
    "EvictionPolicy",
    "CacheStats",
    "global_cache",
    "cache_result",
    
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
    "MuzaiaError",
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
__author__ = "Muzaia Team"
