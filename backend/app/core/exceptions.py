# backend/app/core/exceptions.py

class LLMOrchestratorError(Exception):
    """Exceção base para todos os erros controlados no orquestrador."""
    pass

class LLMServiceError(LLMOrchestratorError):
    """Levantada quando um serviço de LLM específico falha após as retentativas."""
    pass

class ModelNotFoundError(LLMOrchestratorError):
    """Levantada quando um modelo solicitado não está configurado."""
    pass

class ConsensusError(LLMOrchestratorError):
    """Levantada quando as respostas dos modelos são demasiado divergentes."""
    pass

class InvalidInputError(LLMOrchestratorError, ValueError):
    """Levantada quando os dados de entrada para o orquestrador são inválidos."""
    pass

class RateLimitError(LLMOrchestratorError):
    """Levantada quando o limite de requisições é excedido."""
    pass
