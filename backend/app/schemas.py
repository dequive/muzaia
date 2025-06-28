# backend/app/schemas.py

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional
from enum import Enum

class ContextType(Enum):
    """Define os tipos de contexto de negócio para o roteamento de modelos."""
    GENERAL = "general"
    LEGAL_RESEARCH = "legal_research"
    DOCUMENT_ANALYSIS = "document_analysis"

@dataclass(frozen=True)
class LLMResponse:
    """Representa a resposta normalizada de um único modelo LLM."""
    model_name: str
    text: str
    confidence: float
    latency_ms: int
    tokens_used: Optional[int] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass(frozen=True)
class OrchestratorResponse:
    """Representa a resposta final e consolidada do orquestrador."""
    text: str
    confidence: float
    models_used: List[str]
    processing_time_ms: int
    status: str
    context: str
    cached: bool = False
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    sources: List[str] = field(default_factory=list)
    reasoning: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Converte a instância para um dicionário serializável."""
        return asdict(self)
