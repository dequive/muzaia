# -*- coding: utf-8 -*-
"""
Módulo de modelos LLM.

Contém implementações de clientes para diferentes provedores:
- Ollama (modelos locais)
- OpenRouter (modelos via API)
- Cohere (modelos especializados)
"""

from .local_llm import OllamaLLM
from .api_llm import OpenRouterLLM, CohereLLM

# Mapeamento de provedores
PROVIDER_CLASSES = {
    "ollama": OllamaLLM,
    "openrouter": OpenRouterLLM,
    "cohere": CohereLLM,
}

# Padrões de modelo por provedor
MODEL_PATTERNS = {
    "ollama": [
        "llama3", "llama", "gemma2", "gemma", "mistral", 
        "codellama", "phi", "qwen", "vicuna"
    ],
    "openrouter": [
        "qwen/", "openai/", "anthropic/", "google/", 
        "meta-llama/", "mistralai/", "microsoft/"
    ],
    "cohere": [
        "command-r-plus", "command-r", "command", "cohere"
    ],
}

def get_provider_for_model(model_name: str) -> str:
    """
    Determina o provedor baseado no nome do modelo.
    
    Args:
        model_name: Nome do modelo
        
    Returns:
        Nome do provedor ou 'unknown'
    """
    model_lower = model_name.lower()
    
    for provider, patterns in MODEL_PATTERNS.items():
        for pattern in patterns:
            if pattern in model_lower or model_lower.startswith(pattern):
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
        Classe do provedor ou None
    """
    return PROVIDER_CLASSES.get(provider_name)

__all__ = [
    "OllamaLLM",
    "OpenRouterLLM", 
    "CohereLLM",
    "PROVIDER_CLASSES",
    "MODEL_PATTERNS",
    "get_provider_for_model",
    "get_available_providers",
    "get_provider_class",
]
