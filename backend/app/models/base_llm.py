# -*- coding: utf-8 -*-
"""
Módulo da Classe Base Abstrata para Modelos de Linguagem,
alinhado com a arquitetura de protocolos.
"""

import logging
from abc import ABC, abstractmethod
import aiohttp
from typing import Optional, Dict, Any, AsyncGenerator, Type
from types import TracebackType

from app.core.protocols import AbstractLLM, LLMStreamChunk
from app.schemas import LLMResponse, GenerationParams

class BaseLLM(ABC, AbstractLLM):
    """
    Implementação base para o protocolo AbstractLLM.
    Lida com a gestão da sessão aiohttp e o ciclo de vida do gestor de contexto.
    """
    def __init__(self, model_name: str, session: Optional[aiohttp.ClientSession] = None):
        self.model_name = model_name
        self._session = session
        self._owns_session = session is None # Verifica se a classe criou a sua própria sessão
        self.log = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> LLMResponse:
        pass

    @abstractmethod
    async def stream_generate(self, prompt: str, **kwargs) -> AsyncGenerator[LLMStreamChunk, None]:
        yield # Necessário para a sintaxe

    @abstractmethod
    async def health_check(self) -> bool:
        pass

    @abstractmethod
    async def get_model_info(self) -> Dict[str, Any]:
        pass

    async def close(self):
        """Fecha a sessão aiohttp apenas se esta classe a criou."""
        if self._session and not self._session.closed and self._owns_session:
            await self._session.close()
            self.log.info(f"Sessão interna para '{self.model_name}' fechada.")

    async def __aenter__(self) -> "BaseLLM":
        """Cria uma sessão se não for fornecida uma externa."""
        if self._session is None:
            self._session = aiohttp.ClientSession()
            self._owns_session = True
            self.log.debug(f"Sessão interna para '{self.model_name}' criada.")
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> Optional[bool]:
        """Garante que a sessão interna é fechada."""
        await self.close()
        return None
