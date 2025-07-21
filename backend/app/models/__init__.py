# -*- coding: utf-8 -*-
"""
Módulo de modelos LLM.

Estrutura base para implementações de clientes LLM.
Todos os provedores específicos foram removidos.
"""

# Mapeamento de provedores (vazio após remoção)
PROVIDER_CLASSES = {}

# Padrões de modelo por provedor (vazio após remoção)
MODEL_PATTERNS = {}

def get_provider_for_model(model_name: str) -> str:
    """
    Determina o provedor baseado no nome do modelo.
    
    Args:
        model_name: Nome do modelo
        
    Returns:
        'unknown' - todos os provedores foram removidos
    """
    return "unknown"

def get_available_providers() -> list[str]:
    """Retorna lista de provedores disponíveis."""
    return []

def get_provider_class(provider_name: str):
    """
    Obtém classe do provedor.
    
    Args:
        provider_name: Nome do provedor
        
    Returns:
        None - todos os provedores foram removidos
    """
    return None

__all__ = [
    "PROVIDER_CLASSES",
    "MODEL_PATTERNS", 
    "get_provider_for_model",
    "get_available_providers",
    "get_provider_class",
]
