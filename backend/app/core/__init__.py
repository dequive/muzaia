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

# Configurações
from .config import settings

# Componentes principais
from .orchestrator import LLMOrchestrator
from .factory import LLMFactory
from .pool import LLMPool, PoolConfig
from .consensus_engine import HybridConsensusEngine as ConsensusEngine
from .consensus import SemanticConsensusEngine

# Cache
from .cache import (
    AsyncInMemoryCache,
    EvictionPolicy,
    CacheStats,
    global_cache,
    cache_result,
)

# Resiliência
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

# Protocolos e interfaces
from .protocols import (
    AbstractLLM,
    AbstractLLMFactory,
    AbstractLLMPool,
    AbstractConsensusEngine,
    AbstractOrchestrator,
)

# Exceções
from .exceptions import (
    # LLM Errors
    LLMError,
    LLMConnectionError,
    LLMTimeoutError,
    LLMRateLimitError,
    LLMInvalidResponseError,
    
    # Core Errors
    MuzaiaError,
    InvalidInputError,
    LLMServiceError,
    ConsensusError,
    ValidationError,
    
    # Infrastructure Errors
    DatabaseError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    CircuitBreakerError,
    RetryExhaustedError,
)

# Exports organizados por categoria
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
    
    # Protocolos
    "AbstractLLM",
    "AbstractLLMFactory",
    "AbstractLLMPool",
    "AbstractConsensusEngine",
    "AbstractOrchestrator",
    
    # Exceções LLM
    "LLMError",
    "LLMConnectionError",
    "LLMTimeoutError",
    "LLMRateLimitError",
    "LLMInvalidResponseError",
    
    # Exceções Core
    "MuzaiaError",
    "InvalidInputError",
    "LLMServiceError",
    "ConsensusError",
    "ValidationError",
    
    # Exceções Infrastructure
    "DatabaseError",
    "AuthenticationError",
    "AuthorizationError",
    "RateLimitError",
    "CircuitBreakerError",
    "RetryExhaustedError",
]
