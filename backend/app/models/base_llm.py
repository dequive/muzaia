# -*- coding: utf-8 -*-
"""
Módulo da Classe Base Abstrata para Modelos de Linguagem.

Este módulo define a estrutura fundamental que todas as implementações de LLM
na aplicação devem seguir, garantindo consistência e conformidade com o contrato.
"""

import logging
from abc import ABC, abstractmethod
import aiohttp

from app.core.protocols import AbstractLLM
from app.schemas import LLMResponse # Importar o tipo de retorno para a anotação

class BaseLLM(ABC, AbstractLLM):
    """
    Classe base abstrata para todas as implementações de LLM.

    Garante que cada modelo partilha uma interface comum, uma sessão HTTP injetada
    e uma configuração de logging consistente e hierárquica.
    """
    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        """
        Inicializa a instância base do modelo.

        Args:
            model_name: O nome identificador do modelo (ex: 'llama3:8b', 'command-r-plus').
            session: Uma instância de aiohttp.ClientSession partilhada para requisições de rede.
        """
        self.model_name = model_name
        self._session = session
        self.log = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    async def generate(self, prompt: str, context: str) -> LLMResponse:
        """
        Gera uma resposta a partir do modelo.

        Este método deve ser implementado obrigatoriamente por todas as subclasses,
        processando o prompt e retornando uma resposta no formato padronizado LLMResponse.
        """
        pass

    async def close(self):
        """
        Método opcional para fechar recursos.

        Por padrão, não realiza nenhuma ação, pois a sessão aiohttp é gerida
        externamente pelo ciclo de vida da aplicação para ser partilhada entre todos os modelos.
        """
        self.log.info(f"Modelo '{self.model_name}' não requer fecho explícito de recursos.")
        pass
