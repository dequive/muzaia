# -*- coding: utf-8 -*-
"""
Módulo da Fábrica de LLMs.

Responsável por criar instâncias de clientes LLM com base na configuração da aplicação.
Implementa padrões de design robustos para criação e gerenciamento de LLMs.
"""
from __future__ import annotations

import logging
from typing import Dict, Any, Optional, Type, Callable, Awaitable
from functools import lru_cache
import aiohttp

from app.core.protocols import AbstractLLM, AbstractLLMFactory, LLMError
from app.core.config import settings
from app.models.local_llm import OllamaLLM
from app.models.api_llm import OpenRouterLLM
# from app.models.api_llm import CohereLLM  # Descomentar quando CohereLLM for refatorado

logger = logging.getLogger(__name__)

# Type alias para factory functions
LLMFactoryFunction = Callable[[str, aiohttp.ClientSession, Optional[Dict[str, Any]]], Awaitable[AbstractLLM]]


class LLMRegistry:
    """
    Registro de provedores de LLM disponíveis.
    
    Centraliza o mapeamento de modelos para suas respectivas implementações,
    permitindo fácil extensão e manutenção.
    """
    
    def __init__(self):
        self._providers: Dict[str, Type[AbstractLLM]] = {}
        self._model_patterns: Dict[str, str] = {}
        self._factory_functions: Dict[str, LLMFactoryFunction] = {}
        
    def register_provider(
        self, 
        provider_name: str, 
        llm_class: Type[AbstractLLM],
        model_patterns: Optional[list[str]] = None
    ) -> None:
        """
        Registra um provedor de LLM.
        
        Args:
            provider_name: Nome único do provedor
            llm_class: Classe que implementa AbstractLLM
            model_patterns: Padrões de modelo suportados por este provedor
        """
        self._providers[provider_name] = llm_class
        
        if model_patterns:
            for pattern in model_patterns:
                self._model_patterns[pattern] = provider_name
                
        logger.info(f"Provedor '{provider_name}' registrado com {len(model_patterns or [])} padrões")
    
    def register_factory_function(
        self,
        provider_name: str,
        factory_func: LLMFactoryFunction
    ) -> None:
        """
        Registra uma função de fábrica customizada para um provedor.
        
        Args:
            provider_name: Nome do provedor
            factory_func: Função assíncrona que cria instâncias do LLM
        """
        self._factory_functions[provider_name] = factory_func
        logger.info(f"Função de fábrica registrada para '{provider_name}'")
    
    def get_provider_for_model(self, model_name: str) -> Optional[str]:
        """
        Encontra o provedor apropriado para um modelo específico.
        
        Args:
            model_name: Nome do modelo
            
        Returns:
            Nome do provedor ou None se não encontrado
        """
        # Busca exata primeiro
        if model_name in self._model_patterns:
            return self._model_patterns[model_name]
        
        # Busca por padrões (prefixos)
        for pattern, provider in self._model_patterns.items():
            if model_name.startswith(pattern) or pattern in model_name:
                return provider
                
        return None
    
    def get_provider_class(self, provider_name: str) -> Optional[Type[AbstractLLM]]:
        """
        Obtém a classe do provedor.
        
        Args:
            provider_name: Nome do provedor
            
        Returns:
            Classe do provedor ou None se não encontrado
        """
        return self._providers.get(provider_name)
    
    def get_factory_function(self, provider_name: str) -> Optional[LLMFactoryFunction]:
        """
        Obtém a função de fábrica para um provedor.
        
        Args:
            provider_name: Nome do provedor
            
        Returns:
            Função de fábrica ou None se não registrada
        """
        return self._factory_functions.get(provider_name)
    
    def get_all_providers(self) -> list[str]:
        """Retorna lista de todos os provedores registrados."""
        return list(self._providers.keys())
    
    def get_all_models(self) -> list[str]:
        """Retorna lista de todos os modelos/padrões registrados."""
        return list(self._model_patterns.keys())


class LLMFactory(AbstractLLMFactory):
    """
    Implementação concreta da fábrica de LLMs.
    
    Utiliza um sistema de registro flexível para gerenciar diferentes
    provedores e suas configurações específicas.
    """
    
    def __init__(self, session: aiohttp.ClientSession):
        """
        Inicializa a fábrica com uma sessão aiohttp compartilhada.

        Args:
            session: A sessão aiohttp que será injetada em todos os clientes LLM.
        """
        self._session = session
        self._registry = LLMRegistry()
        self._setup_default_providers()
        
        logger.info(f"LLMFactory inicializada com {len(self._registry.get_all_providers())} provedores")

    def _setup_default_providers(self) -> None:
        """
        Configura os provedores padrão baseados nas configurações da aplicação.
        """
        # Registra Ollama
        self._registry.register_provider(
            "ollama",
            OllamaLLM,
            [
                settings.models.ollama_llama_model,
                settings.models.ollama_gemma_model,
                "llama",  # Padrão genérico
                "gemma",  # Padrão genérico
            ]
        )
        
        # Registra OpenRouter
        self._registry.register_provider(
            "openrouter",
            OpenRouterLLM,
            [
                settings.models.openrouter_qwen_model,
                "qwen",  # Padrão genérico
                "openai/",  # Modelos OpenAI via OpenRouter
                "anthropic/",  # Modelos Anthropic via OpenRouter
            ]
        )
        
        # TODO: Registrar Cohere quando refatorado
        # self._registry.register_provider(
        #     "cohere",
        #     CohereLLM,
        #     ["command-r-plus", "command-r", "command"]
        # )

    async def create_llm(
        self, 
        model_name: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> AbstractLLM:
        """
        Cria uma instância de um cliente LLM para um dado nome de modelo.

        Args:
            model_name: O nome do modelo a ser criado (ex: 'llama3:8b').
            config: Configurações extras específicas do modelo.

        Returns:
            Uma instância de um cliente que segue o protocolo AbstractLLM.

        Raises:
            LLMError: Se o nome do modelo for desconhecido ou se houver erro na criação.
        """
        try:
            provider_name = self._registry.get_provider_for_model(model_name)
            
            if not provider_name:
                available_models = self.get_available_models()
                raise LLMError(
                    f"Modelo '{model_name}' não reconhecido. "
                    f"Modelos disponíveis: {', '.join(available_models)}"
                )

            # Verifica se há função de fábrica customizada
            factory_func = self._registry.get_factory_function(provider_name)
            if factory_func:
                return await factory_func(model_name, self._session, config)

            # Usa criação padrão
            llm_class = self._registry.get_provider_class(provider_name)
            if not llm_class:
                raise LLMError(f"Classe do provedor '{provider_name}' não encontrada")

            # Mescla configurações padrão com configurações fornecidas
            final_config = self._merge_configs(provider_name, config)
            
            # Cria instância com configuração
            instance = llm_class(
                model_name=model_name, 
                session=self._session,
                **final_config
            )
            
            logger.info(f"LLM '{model_name}' criado usando provedor '{provider_name}'")
            return instance
            
        except Exception as e:
            logger.error(f"Erro ao criar LLM '{model_name}': {str(e)}")
            if isinstance(e, LLMError):
                raise
            raise LLMError(f"Erro interno ao criar modelo '{model_name}': {str(e)}") from e

    def _merge_configs(
        self, 
        provider_name: str, 
        user_config: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Mescla configurações padrão do provedor com configurações do usuário.
        
        Args:
            provider_name: Nome do provedor
            user_config: Configurações fornecidas pelo usuário
            
        Returns:
            Configuração final mesclada
        """
        default_configs = {
            "ollama": {
                "base_url": getattr(settings, "ollama_base_url", "http://localhost:11434"),
                "timeout": 30,
            },
            "openrouter": {
                "api_key": getattr(settings, "openrouter_api_key", None),
                "timeout": 60,
            },
            "cohere": {
                "api_key": getattr(settings, "cohere_api_key", None),
                "timeout": 45,
            }
        }
        
        final_config = default_configs.get(provider_name, {}).copy()
        
        if user_config:
            final_config.update(user_config)
            
        return final_config

    @lru_cache(maxsize=1)
    def get_available_models(self) -> list[str]:
        """
        Retorna uma lista de todos os nomes de modelos que esta fábrica pode criar.
        
        Returns:
            Lista de modelos disponíveis
        """
        return self._registry.get_all_models()

    def register_custom_provider(
        self,
        provider_name: str,
        llm_class: Type[AbstractLLM],
        model_patterns: list[str],
        factory_function: Optional[LLMFactoryFunction] = None
    ) -> None:
        """
        Registra um provedor customizado em tempo de execução.
        
        Args:
            provider_name: Nome único do provedor
            llm_class: Classe que implementa AbstractLLM
            model_patterns: Padrões de modelo suportados
            factory_function: Função de fábrica customizada (opcional)
        """
        self._registry.register_provider(provider_name, llm_class, model_patterns)
        
        if factory_function:
            self._registry.register_factory_function(provider_name, factory_function)
        
        # Limpa cache para incluir novos modelos
        self.get_available_models.cache_clear()
        
        logger.info(f"Provedor customizado '{provider_name}' registrado com sucesso")

    def get_provider_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Retorna informações sobre todos os provedores registrados.
        
        Returns:
            Dicionário com informações dos provedores
        """
        info = {}
        
        for provider_name in self._registry.get_all_providers():
            llm_class = self._registry.get_provider_class(provider_name)
            models = [
                model for model, provider in self._registry._model_patterns.items()
                if provider == provider_name
            ]
            
            info[provider_name] = {
                "class": llm_class.__name__ if llm_class else "Unknown",
                "models": models,
                "has_custom_factory": provider_name in self._registry._factory_functions
            }
        
        return info

    async def validate_model(self, model_name: str) -> bool:
        """
        Valida se um modelo pode ser criado sem efetivamente criá-lo.
        
        Args:
            model_name: Nome do modelo a validar
            
        Returns:
            True se o modelo for válido, False caso contrário
        """
        try:
            provider_name = self._registry.get_provider_for_model(model_name)
            return provider_name is not None
        except Exception:
            return False

    def __repr__(self) -> str:
        """Representação string da fábrica."""
        providers = len(self._registry.get_all_providers())
        models = len(self.get_available_models())
        return f"LLMFactory(providers={providers}, models={models})"
