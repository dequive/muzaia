# -*- coding: utf-8 -*-
"""
Exceções customizadas para o core do Muzaia.

Sistema hierárquico de exceções com códigos de erro padronizados,
contexto adicional e suporte a logging estruturado.
"""

from typing import Any, Dict, Optional
import traceback
from datetime import datetime


class MuzaiaError(Exception):
    """
    Exceção base para toda a aplicação Muzaia.
    
    Attributes:
        message: Mensagem de erro principal
        code: Código de erro único
        context: Contexto adicional do erro
        timestamp: Momento em que o erro ocorreu
        trace_id: ID para rastreamento distribuído
    """
    
    def __init__(
        self, 
        message: str = "Erro desconhecido em Muzaia", 
        code: str = "MUZAIA_ERROR",
        context: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None
    ):
        super().__init__(f"{code}: {message}")
        self.message = message
        self.code = code
        self.context = context or {}
        self.timestamp = datetime.utcnow()
        self.trace_id = trace_id
        self._traceback = traceback.format_exc()
    
    def to_dict(self) -> Dict[str, Any]:
        """Serializa o erro para logging estruturado."""
        return {
            "error_type": self.__class__.__name__,
            "code": self.code,
            "message": self.message,
            "context": self.context,
            "timestamp": self.timestamp.isoformat(),
            "trace_id": self.trace_id,
        }
    
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(code='{self.code}', message='{self.message}')"


# =============================================================================
# CORE ERRORS
# =============================================================================

class InvalidInputError(MuzaiaError):
    """Erro de entrada inválida."""
    def __init__(self, message: str = "Input inválido", **kwargs):
        super().__init__(message, "INVALID_INPUT_ERROR", **kwargs)


class ValidationError(MuzaiaError):
    """Erro de validação de dados."""
    def __init__(self, message: str = "Erro de validação", field: str = None, **kwargs):
        context = kwargs.get('context', {})
        if field:
            context['field'] = field
        kwargs['context'] = context
        super().__init__(message, "VALIDATION_ERROR", **kwargs)


# =============================================================================
# INFRASTRUCTURE ERRORS  
# =============================================================================

class DatabaseError(MuzaiaError):
    """Erro de banco de dados."""
    def __init__(self, message: str = "Erro no banco de dados", **kwargs):
        super().__init__(message, "DATABASE_ERROR", **kwargs)


class AuthenticationError(MuzaiaError):
    """Erro de autenticação."""
    def __init__(self, message: str = "Erro de autenticação", **kwargs):
        super().__init__(message, "AUTHENTICATION_ERROR", **kwargs)


class AuthorizationError(MuzaiaError):
    """Erro de autorização."""
    def __init__(self, message: str = "Erro de autorização", **kwargs):
        super().__init__(message, "AUTHORIZATION_ERROR", **kwargs)


# =============================================================================
# RESILIENCE ERRORS
# =============================================================================

class RateLimitError(MuzaiaError):
    """Erro de limite de taxa excedido."""
    def __init__(
        self, 
        message: str = "Limite de taxa excedido",
        limit: Optional[int] = None,
        window: Optional[int] = None,
        **kwargs
    ):
        context = kwargs.get('context', {})
        if limit:
            context['limit'] = limit
        if window:
            context['window_seconds'] = window
        kwargs['context'] = context
        super().__init__(message, "RATE_LIMIT_ERROR", **kwargs)


class CircuitBreakerError(MuzaiaError):
    """Erro quando circuit breaker está aberto."""
    def __init__(
        self, 
        message: str = "Circuit breaker aberto",
        service: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.get('context', {})
        if service:
            context['service'] = service
        kwargs['context'] = context
        super().__init__(message, "CIRCUIT_BREAKER_ERROR", **kwargs)


class RetryExhaustedError(MuzaiaError):
    """Erro quando todas as tentativas de retry foram esgotadas."""
    def __init__(
        self, 
        message: str = "Tentativas de retry esgotadas",
        attempts: Optional[int] = None,
        **kwargs
    ):
        context = kwargs.get('context', {})
        if attempts:
            context['attempts'] = attempts
        kwargs['context'] = context
        super().__init__(message, "RETRY_EXHAUSTED_ERROR", **kwargs)


# =============================================================================
# LLM ERRORS
# =============================================================================

class LLMError(MuzaiaError):
    """Erro geral relacionado a LLM."""
    def __init__(
        self, 
        message: str = "Erro em LLM", 
        code: str = "LLM_ERROR",
        provider: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs
    ):
        context = kwargs.get('context', {})
        if provider:
            context['provider'] = provider
        if model:
            context['model'] = model
        kwargs['context'] = context
        super().__init__(message, code, **kwargs)


class LLMConnectionError(LLMError):
    """Erro de conexão com LLM."""
    def __init__(self, message: str = "Erro de conexão LLM", **kwargs):
        super().__init__(message, "LLM_CONNECTION_ERROR", **kwargs)


class LLMTimeoutError(LLMError):
    """Erro de timeout na comunicação com LLM."""
    def __init__(
        self, 
        message: str = "Timeout na comunicação com LLM",
        timeout_seconds: Optional[float] = None,
        **kwargs
    ):
        context = kwargs.get('context', {})
        if timeout_seconds:
            context['timeout_seconds'] = timeout_seconds
        kwargs['context'] = context
        super().__init__(message, "LLM_TIMEOUT_ERROR", **kwargs)


class LLMRateLimitError(LLMError):
    """Erro de limite de taxa LLM."""
    def __init__(self, message: str = "Limite de taxa da LLM excedido", **kwargs):
        super().__init__(message, "LLM_RATE_LIMIT_ERROR", **kwargs)


class LLMInvalidResponseError(LLMError):
    """Erro de resposta inválida do LLM."""
    def __init__(
        self, 
        message: str = "Resposta inválida do LLM",
        response_data: Optional[Any] = None,
        **kwargs
    ):
        context = kwargs.get('context', {})
        if response_data:
            context['response_data'] = str(response_data)[:500]  # Limita tamanho
        kwargs['context'] = context
        super().__init__(message, "LLM_INVALID_RESPONSE_ERROR", **kwargs)


class LLMServiceError(LLMError):
    """Erro no serviço LLM."""
    def __init__(self, message: str = "Erro no serviço LLM", **kwargs):
        super().__init__(message, "LLM_SERVICE_ERROR", **kwargs)


# =============================================================================
# CONSENSUS ERRORS
# =============================================================================

class ConsensusError(MuzaiaError):
    """Erro no sistema de consenso."""
    def __init__(
        self, 
        message: str = "Erro no sistema de consenso",
        algorithm: Optional[str] = None,
        participants: Optional[int] = None,
        **kwargs
    ):
        context = kwargs.get('context', {})
        if algorithm:
            context['algorithm'] = algorithm
        if participants:
            context['participants'] = participants
        kwargs['context'] = context
        super().__init__(message, "CONSENSUS_ERROR", **kwargs)


# =============================================================================
# UTILITIES
# =============================================================================

def create_error_response(error: MuzaiaError) -> Dict[str, Any]:
    """Cria resposta padronizada para APIs."""
    return {
        "error": True,
        "code": error.code,
        "message": error.message,
        "timestamp": error.timestamp.isoformat(),
        "trace_id": error.trace_id,
        "details": error.context
    }


# Lista de todas as exceções para import
__all__ = [
    # Base
    "MuzaiaError",
    
    # Core
    "InvalidInputError",
    "ValidationError", 
    
    # Infrastructure
    "DatabaseError",
    "AuthenticationError",
    "AuthorizationError",
    
    # Resilience
    "RateLimitError",
    "CircuitBreakerError", 
    "RetryExhaustedError",
    
    # LLM
    "LLMError",
    "LLMConnectionError",
    "LLMTimeoutError", 
    "LLMRateLimitError",
    "LLMInvalidResponseError",
    "LLMServiceError",
    
    # Consensus
    "ConsensusError",
    
    # Utilities
    "create_error_response",
]
