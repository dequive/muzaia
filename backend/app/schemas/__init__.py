# Schemas do Glossário
from .glossario import (
    GlossarioTermoBase,
    GlossarioTermoCreate,
    GlossarioTermoUpdate,
    GlossarioTermoResponse,
    GlossarioSearchRequest,
    GlossarioSearchResponse,
    GlossarioStats,
    CategoriaJuridica,
    NivelTecnico,
    StatusGlossario
)

# Schemas do LLM
from .llm import (
    LLMProvider,
    GenerationParams,
    LLMRequest,
    LLMResponse,
    LLMError
)

# Schemas principais (compatibilidade)
from app.schemas import ModelResponse

__all__ = [
    # Glossário
    "GlossarioTermoBase",
    "GlossarioTermoCreate",
    "GlossarioTermoUpdate",
    "GlossarioTermoResponse",
    "GlossarioSearchRequest",
    "GlossarioSearchResponse",
    "GlossarioStats",
    "CategoriaJuridica",
    "NivelTecnico",
    "StatusGlossario",

    # LLM
    "LLMProvider",
    "GenerationParams",
    "LLMRequest",
    "LLMResponse",
    "LLMError",
    "ModelResponse"
]