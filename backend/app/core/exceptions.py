# backend/app/core/exceptions.py

# -*- coding: utf-8 -*-
"""
Módulo central para as exceções personalizadas da aplicação.
"""

# Exceções da Aplicação Principal
class LLMOrchestratorError(Exception):
    """Exceção base para erros no orquestrador."""
    pass

class InvalidInputError(LLMOrchestratorError):
    """Erro para entradas inválidas do utilizador."""
    pass

class ConsensusError(LLMOrchestratorError):
    """Erro quando o consenso entre modelos não é alcançado."""
    pass

# --- Nova Hierarquia de Exceções para os Clientes LLM ---

class LLMError(Exception):
    """Exceção base para todos os erros relacionados a um cliente LLM específico."""
    def __init__(self, message: str, model_name: str = "unknown"):
        self.model_name = model_name
        super().__init__(f"[{model_name}] {message}")

class LLMConnectionError(LLMError):
    """Erro de conexão com o serviço LLM (ex: DNS, falha de rede)."""
    pass

class LLMRateLimitError(LLMError):
    """Erro de limite de taxa excedido."""
    pass

class LLMInvalidResponseError(LLMError):
    """Erro de resposta mal formada ou inesperada do LLM."""
    pass

class ModelNotFoundError(LLMError):
    """Erro quando o modelo especificado não é encontrado no serviço."""
    pass
