# -*- coding: utf-8 -*-
"""
Módulo de modelos LLM.

Estrutura base para implementações de clientes LLM.
Todos os provedores específicos foram removidos.
"""

# Importar novos clientes LLM
from .claude_llm import ClaudeLLM
from .gemini_llm import GeminiLLM

# Mapeamento de provedores
PROVIDER_CLASSES = {
    "anthropic": ClaudeLLM,
    "google": GeminiLLM,
}

# Padrões de modelo por provedor
MODEL_PATTERNS = {
    # Claude models
    "claude-3-5-sonnet": "anthropic",
    "claude-3-5-sonnet-20241022": "anthropic",
    "claude-3-sonnet": "anthropic",
    "claude-3-opus": "anthropic",
    "claude-3-haiku": "anthropic",
    
    # Gemini models
    "gemini-1.5-pro": "google",
    "gemini-1.5-pro-latest": "google",
    "gemini-1.5-flash": "google",
    "gemini-pro": "google",
}

def get_provider_for_model(model_name: str) -> str:
    """
    Determina o provedor baseado no nome do modelo.
    
    Args:
        model_name: Nome do modelo
        
    Returns:
        Nome do provedor ou 'unknown' se não encontrado
    """
    # Busca exata primeiro
    if model_name in MODEL_PATTERNS:
        return MODEL_PATTERNS[model_name]
    
    # Busca por padrões (prefixos)
    for pattern, provider in MODEL_PATTERNS.items():
        if model_name.startswith(pattern):
            return provider
    
    return "unknown"

def get_available_providers() -> list[str]:
    """Retorna lista de provedores disponíveis."""
    return list(PROVIDER_CLASSES.keys())

def get_provider_class(provider_name: str):
    """
    Obtém classe do provedor.
    
    Args:
        provider_name: Nome do provedor
        
    Returns:
        Classe do provedor ou None se não encontrado
    """
    return PROVIDER_CLASSES.get(provider_name)

__all__ = [
    "PROVIDER_CLASSES",
    "MODEL_PATTERNS", 
    "get_provider_for_model",
    "get_available_providers",
    "get_provider_class",
]
