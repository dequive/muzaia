from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from enum import Enum


class ModelResponse(BaseModel):
    """Resposta individual de um modelo."""
    model_name: str
    response_text: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    processing_time: float
    tokens_used: int = 0
    cost: float = 0.0
    error: Optional[str] = None


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    LOCAL = "local"

class GenerationParams(BaseModel):
    """Parâmetros para geração de texto via LLM"""
    max_tokens: Optional[int] = Field(default=1000, ge=1, le=4000)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    top_k: Optional[int] = Field(default=None, ge=1)
    frequency_penalty: Optional[float] = Field(default=0.0, ge=-2.0, le=2.0)
    presence_penalty: Optional[float] = Field(default=0.0, ge=-2.0, le=2.0)
    stop: Optional[List[str]] = Field(default=None)
    stream: Optional[bool] = Field(default=False)

class LLMRequest(BaseModel):
    """Request para o LLM"""
    prompt: str = Field(..., min_length=1)
    system_prompt: Optional[str] = Field(default=None)
    params: Optional[GenerationParams] = Field(default_factory=GenerationParams)
    provider: Optional[LLMProvider] = Field(default=LLMProvider.OPENAI)
    model: Optional[str] = Field(default=None)

class LLMResponse(BaseModel):
    """Resposta do LLM"""
    content: str
    provider: str
    model: str
    tokens_used: Optional[int] = Field(default=0)
    processing_time: Optional[float] = Field(default=0.0)
    cost: Optional[float] = Field(default=0.0)
    usage: Optional[Dict[str, Any]] = Field(default=None)
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    success: bool = Field(default=True)
    error: Optional[str] = Field(default=None)

class LLMError(BaseModel):
    """Erro do LLM"""
    message: str
    provider: str
    error_code: Optional[str] = Field(default=None)
    details: Optional[Dict[str, Any]] = Field(default=None)