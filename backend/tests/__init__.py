# -*- coding: utf-8 -*-
"""
Módulo de inicialização de testes para Muzaia.

Fornece utilitários comuns e imports para testes unitários e de integração.
Facilita a importação de componentes do core em fixtures e mocks.
"""

# Imports principais do core
from app.core import (
    # Configurações
    settings,
    
    # Componentes principais
    LLMOrchestrator,
    LLMFactory,
    LLMPool,
    PoolConfig,
    ConsensusEngine,
    SemanticConsensusEngine,
    
    # Cache para testes
    AsyncInMemoryCache,
    global_cache,
    
    # Resiliência para testes
    CircuitBreaker,
    RateLimiter,
    resilience_manager,
    
    # Protocolos para mocks
    AbstractLLM,
    AbstractLLMFactory,
    AbstractLLMPool,
    AbstractConsensusEngine,
    AbstractOrchestrator,
    
    # Exceções para assertions
    MuzaiaError,
    LLMError,
    LLMConnectionError,
    LLMTimeoutError,
    ConsensusError,
    ValidationError,
)

# Utilitários de teste (a serem implementados)
__all__ = [
    # Re-exports do core
    "settings",
    "LLMOrchestrator", 
    "LLMFactory",
    "LLMPool",
    "PoolConfig",
    "ConsensusEngine",
    "SemanticConsensusEngine",
    "AsyncInMemoryCache",
    "global_cache",
    "CircuitBreaker",
    "RateLimiter", 
    "resilience_manager",
    "AbstractLLM",
    "AbstractLLMFactory",
    "AbstractLLMPool",
    "AbstractConsensusEngine",
    "AbstractOrchestrator",
    "MuzaiaError",
    "LLMError",
    "LLMConnectionError", 
    "LLMTimeoutError",
    "ConsensusError",
    "ValidationError",
]

# Configurações específicas para testes
TEST_CONFIG = {
    "cache_ttl": 60,  # Cache menor para testes
    "retry_attempts": 2,  # Menos tentativas para testes rápidos
    "timeout": 5.0,  # Timeout menor para testes
    "debug": True,
}

# TODO: Adicionar fixtures comuns e utilitários de teste
