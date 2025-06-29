# -*- coding: utf-8 -*-
"""
Protocolos e interfaces abstratas para o sistema Mozaia.
"""
from __future__ import annotations

import abc
from typing import Dict, Any, Optional, List, AsyncGenerator
from contextlib import asynccontextmanager

from app.schemas import LLMResponse, GenerationParams


class AbstractLLM(abc.ABC):
    """Interface abstrata para todos os clientes LLM."""
    
    @abc.abstractmethod
    async def generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """Gera resposta usando o modelo LLM."""
        pass
    
    @abc.abstractmethod
    async def stream_generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Gera resposta em streaming."""
        pass
    
    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Verifica se o modelo está saudável."""
        pass
    
    @abc.abstractmethod
    async def close(self) -> None:
        """Fecha recursos do modelo."""
        pass


class AbstractLLMFactory(abc.ABC):
    """Interface abstrata para fábricas de LLM."""
    
    @abc.abstractmethod
    async def create_llm(
        self, 
        model_name: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> AbstractLLM:
        """Cria instância de LLM."""
        pass
    
    @abc.abstractmethod
    def get_available_models(self) -> List[str]:
        """Retorna modelos disponíveis."""
        pass
    
    @abc.abstractmethod
    async def validate_model(self, model_name: str) -> bool:
        """Valida se modelo pode ser criado."""
        pass


class AbstractLLMPool(abc.ABC):
    """Interface abstrata para pools de LLM."""
    
    @abc.abstractmethod
    @asynccontextmanager
    async def acquire(self, model_name: str) -> AsyncGenerator[AbstractLLM, None]:
        """Adquire instância do pool."""
        pass
    
    @abc.abstractmethod
    async def close_all(self) -> None:
        """Fecha todas as instâncias."""
        pass
    
    @abc.abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do pool."""
        pass


# Exceção base para o protocolo
class LLMError(Exception):
    """Exceção base para erros de LLM."""
    pass
