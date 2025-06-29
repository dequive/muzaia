# -*- coding: utf-8 -*-
"""
Exceções customizadas da aplicação.
"""


class MozaiaError(Exception):
    """Exceção base para todas as exceções da aplicação."""
    
    def __init__(self, message: str, error_code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class LLMError(MozaiaError):
    """Exceção base para erros relacionados ao LLM."""
    pass


class LLMConnectionError(LLMError):
    """Erro de conexão com o serviço LLM."""
    
    def __init__(self, message: str = "Erro de conexão com LLM"):
        super().__init__(message, "LLM_CONNECTION_ERROR")


class LLMRateLimitError(LLMError):
    """Erro de limite de taxa excedido."""
    
    def __init__(self, message: str = "Limite de taxa excedido"):
        super().__init__(message, "LLM_RATE_LIMIT_ERROR")


class LLMInvalidResponseError(LLMError):
    """Erro de resposta inválida do LLM."""
    
    def __init__(self, message: str = "Resposta inválida do LLM"):
        super().__init__(message, "LLM_INVALID_RESPONSE_ERROR")


class ConsensusError(MozaiaError):
    """Erro no sistema de consenso."""
    
    def __init__(self, message: str = "Erro no sistema de consenso"):
        super().__init__(message, "CONSENSUS_ERROR")


class LLMServiceError(MozaiaError):
    """Erro no serviço LLM."""
    
    def __init__(self, message: str = "Erro no serviço LLM"):
        super().__init__(message, "LLM_SERVICE_ERROR")


class InvalidInputError(MozaiaError):
    """Erro de entrada inválida."""
    
    def __init__(self, message: str = "Entrada inválida"):
        super().__init__(message, "INVALID_INPUT_ERROR")


class ValidationError(MozaiaError):
    """Erro de validação."""
    
    def __init__(self, message: str = "Erro de validação"):
        super().__init__(message, "VALIDATION_ERROR")


class DatabaseError(MozaiaError):
    """Erro de banco de dados."""
    
    def __init__(self, message: str = "Erro de banco de dados"):
        super().__init__(message, "DATABASE_ERROR")


class AuthenticationError(MozaiaError):
    """Erro de autenticação."""
    
    def __init__(self, message: str = "Erro de autenticação"):
        super().__init__(message, "AUTHENTICATION_ERROR")


class AuthorizationError(MozaiaError):
    """Erro de autorização."""
    
    def __init__(self, message: str = "Erro de autorização"):
        super().__init__(message, "AUTHORIZATION_ERROR")


class RateLimitError(MozaiaError):
    """Erro de limite de taxa excedido (para resiliência)."""
    
    def __init__(self, message: str = "Limite de taxa excedido"):
        super().__init__(message, "RATE_LIMIT_ERROR")


class CircuitBreakerError(MozaiaError):
    """Erro quando circuit breaker está aberto."""
    
    def __init__(self, message: str = "Circuit breaker aberto"):
        super().__init__(message, "CIRCUIT_BREAKER_ERROR")


class RetryExhaustedError(MozaiaError):
    """Erro quando todas as tentativas de retry foram esgotadas."""
    
    def __init__(self, message: str = "Tentativas de retry esgotadas"):
        super().__init__(message, "RETRY_EXHAUSTED_ERROR")
