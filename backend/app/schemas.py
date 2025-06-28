# backend/app/schemas.py

# -*- coding: utf-8 -*-
"""
Módulo central para os schemas (modelos de dados) da aplicação.

Define a estrutura, tipos e validação para todos os objetos de dados
que fluem através do sistema, usando Pydantic.
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Literal
from enum import Enum
from datetime import datetime
import json

from pydantic import BaseModel, Field as PydanticField, field_validator, root_validator

# --- Enums e Estruturas de Dados do Orquestrador ---

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

# --- Schemas Detalhados (Integrados da sua implementação avançada) ---

class GenerationParams(BaseModel):
    """Parâmetros de geração para os modelos de linguagem."""
    temperature: float = PydanticField(0.3, ge=0, le=2.0, description="Controla a criatividade. Valores mais altos = mais criativo.")
    top_p: float = PydanticField(0.9, ge=0, le=1, description="Nucleus sampling: considera apenas os tokens com probabilidade cumulativa > top_p.")
    top_k: int = PydanticField(40, ge=1, le=100, description="Considera apenas os 'k' tokens mais prováveis.")
    max_tokens: int = PydanticField(1024, gt=0, le=4096, description="Número máximo de tokens a serem gerados na resposta.")
    timeout: int = PydanticField(60, gt=0, le=300, description="Timeout para a chamada ao modelo (em segundos).")
    repeat_penalty: float = PydanticField(1.1, ge=0.1, le=2.0, description="Penaliza a repetição de tokens.")
    seed: Optional[int] = PydanticField(None, description="Semente para geração determinística.")
    frequency_penalty: float = PydanticField(0.0, ge=0, le=2.0, description="Penaliza tokens com base na sua frequência no texto até agora.")
    presence_penalty: float = PydanticField(0.0, ge=0, le=2.0, description="Penaliza tokens por já terem aparecido no texto.")

    class Config:
        extra = "forbid" # Não permite parâmetros extras

class ChatMessage(BaseModel):
    """Representa uma única mensagem num histórico de conversação."""
    role: Literal["system", "user", "assistant"]
    content: str = PydanticField(..., min_length=1)
    timestamp: datetime = PydanticField(default_factory=datetime.now)
    tokens: Optional[int] = PydanticField(None, description="Contagem de tokens da mensagem (se calculada).")

class PromptTemplate(BaseModel):
    """Define um template de prompt reutilizável."""
    name: str = PydanticField(..., min_length=1, description="Nome único do template.")
    template: str = PydanticField(..., min_length=1, description="O texto do template, com variáveis em {chaves}.")
    variables: List[str] = PydanticField(..., description="Lista de nomes de variáveis esperadas no template.")
    description: Optional[str] = PydanticField(None, description="Descrição do propósito do template.")
    system_prompt: Optional[str] = PydanticField(None, description="Instrução de sistema associada ao template.")

    @root_validator(skip_on_failure=True)
    def validate_variables_in_template(cls, values):
        """Valida se todas as variáveis declaradas existem no texto do template."""
        template, variables = values.get('template', ''), values.get('variables', [])
        for var in variables:
            if f"{{{var}}}" not in template:
                raise ValueError(f"A variável '{var}' declarada não foi encontrada no template.")
        return values
