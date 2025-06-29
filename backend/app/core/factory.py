# -*- coding: utf-8 -*-
"""
Fábrica Avançada de LLMs com Registro Dinâmico.

Sistema robusto para criação e gerenciamento de instâncias LLM
com suporte a provedores customizados e configurações flexíveis.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Dict, Any, Optional, Type, Callable, Awaitable
from functools import lru_cache
import aiohttp

from app.core.protocols import AbstractLLM, AbstractLLMFactory, LLMError
from app.core.config import settings
from app.models.local_llm import OllamaLLM
from app.models.api_llm import OpenRouterLLM, CohereLLM

logger = logging.getLogger(__name__)

# Type alias para factory functions
LLMFactoryFunction = Callable[[str, aiohttp.ClientSession, Optional[Dict[str, Any]]], Awaitable[AbstractLLM]]


class LLMRegistry:
    """
    Registro central de provedores de LLM.
    
    Gerencia mapeamento de modelos para implementações,
    permitindo extensibilidade e manutenção simplificada.
    """
    
    def __init__(self):
        self._providers: Dict[str, Type[AbstractLLM]] = {}
        self._model_patterns: Dict[str, str] = {}
        self._factory_functions: Dict[str, LLMFactoryFunction] = {}
        self._provider_configs: Dict[str, Dict[str, Any]] = {}
        
    def register_provider(
        self, 
        provider_name: str, 
        llm_class: Type[AbstractLLM],
        model_patterns: Optional[list[str]] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Registra um provedor de LLM.
        
        Args:
            provider_name: Nome único do provedor
            llm_class: Classe que implementa AbstractLLM
            model_patterns: Padrões de modelo suportados
            config: Configuração específica do provedor
        """
        self._providers[provider_name] = llm_class
        self._provider_configs[provider_name] = config or {}
        
        if model_patterns:
            for pattern in model_patterns:
                self._model_patterns[pattern] = provider_name
                
        logger.info(
            f"Provedor '{provider_name}' registrado com "
            f"{len(model_patterns or [])} padrões de modelo"
        )
    
    def register_factory_function(
        self,
        provider_name: str,
        factory_func: LLMFactoryFunction
    ) -> None:
        """
        Registra função de fábrica customizada.
        
        Args:
            provider_name: Nome do provedor
            factory_func: Função assíncrona de criação
        """
        self._factory_functions[provider_name] = factory_func
        logger.info(f"Função de fábrica registrada para '{provider_name}'")
    
    def get_provider_for_model(self, model_name: str) -> Optional[str]:
        """
        Encontra provedor apropriado para um modelo.
        
        Args:
            model_name: Nome do modelo
            
        Returns:
            Nome do provedor ou None se não encontrado
        """
        # Busca exata primeiro
        if model_name in self._model_patterns:
            return self._model_patterns[model_name]
        
        # Busca por padrões (prefixos e substrings)
        for pattern, provider in self._model_patterns.items():
            if (model_name.startswith(pattern) or 
                pattern in model_name or
                self._fuzzy_match(model_name, pattern)):
                return provider
                
        return None
    
    def _fuzzy_match(self, model_name: str, pattern: str) -> bool:
        """Implementa matching fuzzy para modelos."""
        # Normalizar nomes para comparação
        model_norm = model_name.lower().replace('-', '').replace('_', '')
        pattern_norm = pattern.lower().replace('-', '').replace('_', '')
        
        # Verificar se padrão está contido no nome do modelo
        return pattern_norm in model_norm
    
    def get_provider_class(self, provider_name: str) -> Optional[Type[AbstractLLM]]:
        """Obtém classe do provedor."""
        return self._providers.get(provider_name)
    
    def get_provider_config(self, provider_name: str) -> Dict[str, Any]:
        """Obtém configuração do provedor."""
        return self._provider_configs.get(provider_name, {})
    
    def get_factory_function(self, provider_name: str) -> Optional[LLMFactoryFunction]:
        """Obtém função de fábrica customizada."""
        return self._factory_functions.get(provider_name)
    
    def get_all_providers(self) -> list[str]:
        """Retorna todos os provedores registrados."""
        return list(self._providers.keys())
    
    def get_all_models(self) -> list[str]:
        """Retorna todos os modelos/padrões registrados."""
        return list(self._model_patterns.keys())
    
    def get_provider_info(self, provider_name: str) -> Dict[str, Any]:
        """Obtém informações detalhadas de um provedor."""
        if provider_name not in self._providers:
            return {}
        
        models = [
            model for model, provider in self._model_patterns.items()
            if provider == provider_name
        ]
        
        return {
            "class": self._providers[provider_name].__name__,
            "models": models,
            "config": self._provider_configs[provider_name],
            "has_custom_factory": provider_name in self._factory_functions
        }


class LLMFactory(AbstractLLMFactory):
    """
    Fábrica robusta de LLMs com registro dinâmico.
    
    Características:
    - Sistema de registro flexível
    - Configuração por provedor
    - Funções de fábrica customizadas
    - Validação automática
    - Cache de instâncias
    - Métricas de criação
    """
    
    def __init__(self, session: aiohttp.ClientSession):
        """
        Inicializa a fábrica com sessão HTTP compartilhada.

        Args:
            session: Sessão aiohttp para todas as instâncias LLM
        """
        self._session = session
        self._registry = LLMRegistry()
        self._creation_metrics = {
            "total_created": 0,
            "created_by_provider": {},
            "creation_errors": 0,
            "last_creation_time": None
        }
        
        # Setup inicial dos provedores
        self._setup_default_providers()
        
        logger.info(
            f"LLMFactory inicializada com {len(self._registry.get_all_providers())} provedores"
        )

    def _setup_default_providers(self) -> None:
        """Configura provedores padrão baseados nas configurações."""
        
        # Configurar Ollama
        ollama_config = {
            "base_url": settings.models.ollama_base_url,
            "timeout": 60,
            "max_retries": 3
        }
        
        self._registry.register_provider(
            "ollama",
            OllamaLLM,
            [
                settings.models.ollama_llama_model,
                settings.models.ollama_gemma_model,
                "llama3",
                "llama",
                "gemma2",
                "gemma",
                "mistral",
                "codellama",
                "phi",
                "qwen"
            ],
            ollama_config
        )
        
        # Configurar OpenRouter
        if settings.models.openrouter_api_key:
            openrouter_config = {
                "api_key": settings.models.openrouter_api_key,
                "timeout": 90,
                "max_retries": 3
            }
            
            self._registry.register_provider(
                "openrouter",
                OpenRouterLLM,
                [
                    settings.models.openrouter_qwen_model,
                    "qwen/qwen",
                    "openai/",
                    "anthropic/",
                    "google/",
                    "meta-llama/",
                    "mistralai/",
                    "microsoft/"
                ],
                openrouter_config
            )
        
        # Configurar Cohere
        if settings.models.cohere_api_key:
            cohere_config = {
                "api_key": settings.models.cohere_api_key,
                "timeout": 75,
                "max_retries": 3
            }
            
            self._registry.register_provider(
                "cohere",
                CohereLLM,
                [
                    settings.models.cohere_model,
                    "command-r-plus",
                    "command-r",
                    "command",
                    "cohere"
                ],
                cohere_config
            )
            
        # Registrar função de fábrica customizada para Ollama
        self._registry.register_factory_function(
            "ollama",
            self._create_ollama_instance
        )

    async def create_llm(
        self, 
        model_name: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> AbstractLLM:
        """
        Cria instância de LLM para um modelo específico.

        Args:
            model_name: Nome do modelo (ex: 'llama3:8b')
            config: Configurações extras específicas

        Returns:
            Instância configurada do LLM

        Raises:
            LLMError: Se não conseguir criar a instância
        """
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Encontrar provedor para o modelo
            provider_name = self._registry.get_provider_for_model(model_name)
            
            if not provider_name:
                available_models = self.get_available_models()
                raise LLMError(
                    f"Modelo '{model_name}' não reconhecido. "
                    f"Modelos disponíveis: {', '.join(available_models[:10])}..."
                )

            logger.debug(f"Criando instância de '{model_name}' usando provedor '{provider_name}'")
            
            # Verificar função de fábrica customizada
            factory_func = self._registry.get_factory_function(provider_name)
            if factory_func:
                instance = await factory_func(model_name, self._session, config)
            else:
                # Criação padrão
                instance = await self._create_standard_instance(
                    provider_name, model_name, config
                )
            
            # Atualizar métricas
            creation_time = asyncio.get_event_loop().time() - start_time
            self._update_creation_metrics(provider_name, creation_time, True)
            
            logger.info(
                f"LLM '{model_name}' criado com sucesso usando '{provider_name}' "
                f"em {creation_time:.2f}s"
            )
            
            return instance
            
        except Exception as e:
            creation_time = asyncio.get_event_loop().time() - start_time
            self._update_creation_metrics("unknown", creation_time, False)
            
            logger.error(f"Erro ao criar LLM '{model_name}': {str(e)}")
            if isinstance(e, LLMError):
                raise
            raise LLMError(f"Erro interno ao criar modelo '{model_name}': {str(e)}") from e

    async def _create_standard_instance(
        self,
        provider_name: str,
        model_name: str,
        user_config: Optional[Dict[str, Any]]
    ) -> AbstractLLM:
        """Cria instância usando método padrão."""
        
        # Obter classe do provedor
        llm_class = self._registry.get_provider_class(provider_name)
        if not llm_class:
            raise LLMError(f"Classe do provedor '{provider_name}' não encontrada")

        # Mesclar configurações
        final_config = self._merge_configs(provider_name, user_config)
        
        # Criar instância
        try:
            # Diferentes assinaturas de construtor
            if provider_name == "cohere":
                # Cohere pode não precisar de model_name no construtor
                instance = llm_class(session=self._session, **final_config)
            else:
                # Padrão: model_name + session
                instance = llm_class(
                    model_name=model_name,
                    session=self._session,
                    **final_config
                )
            
            return instance
            
        except TypeError as e:
            # Tentar sem configurações extras se houver problema de assinatura
            logger.warning(f"Erro de assinatura para {provider_name}, tentando construtor básico: {e}")
            try:
                if provider_name == "cohere":
                    instance = llm_class(session=self._session)
                else:
                    instance = llm_class(model_name=model_name, session=self._session)
                return instance
            except Exception as fallback_error:
                raise LLMError(
                    f"Erro ao criar instância {provider_name}: {fallback_error}"
                ) from fallback_error

    async def _create_ollama_instance(
        self,
        model_name: str,
        session: aiohttp.ClientSession,
        config: Optional[Dict[str, Any]]
    ) -> AbstractLLM:
        """Função de fábrica customizada para Ollama."""
        
        # Verificar se modelo está disponível no Ollama
        available = await self._check_ollama_model_availability(model_name)
        if not available:
            logger.warning(f"Modelo {model_name} não encontrado no Ollama, tentando baixar...")
            await self._pull_ollama_model(model_name)
        
        # Configurações específicas do Ollama
        ollama_config = self._registry.get_provider_config("ollama").copy()
        if config:
            ollama_config.update(config)
        
        return OllamaLLM(model_name=model_name, session=session, **ollama_config)

    async def _check_ollama_model_availability(self, model_name: str) -> bool:
        """Verifica se modelo está disponível no Ollama."""
        try:
            async with self._session.get(
                f"{settings.models.ollama_base_url}/api/tags",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    available_models = [model["name"] for model in data.get("models", [])]
                    return model_name in available_models
                    
                return False
                
        except Exception as e:
            logger.warning(f"Erro ao verificar disponibilidade do modelo {model_name}: {e}")
            return False

    async def _pull_ollama_model(self, model_name: str) -> bool:
        """Tenta baixar modelo no Ollama."""
        try:
            logger.info(f"Tentando baixar modelo {model_name} no Ollama...")
            
            async with self._session.post(
                f"{settings.models.ollama_base_url}/api/pull",
                json={"name": model_name},
                timeout=aiohttp.ClientTimeout(total=300)  # 5 minutos para download
            ) as response:
                
                if response.status == 200:
                    logger.info(f"Modelo {model_name} baixado com sucesso")
                    return True
                else:
                    logger.error(f"Falha ao baixar modelo {model_name}: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erro ao baixar modelo {model_name}: {e}")
            return False

    def _merge_configs(
        self, 
        provider_name: str, 
        user_config: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Mescla configurações do provedor com configurações do usuário."""
        
        # Configurações base do provedor
        base_config = self._registry.get_provider_config(provider_name).copy()
        
        # Configurações padrão por provedor
        default_configs = {
            "ollama": {
                "base_url": settings.models.ollama_base_url,
                "timeout": 60,
                "max_retries": 3
            },
            "openrouter": {
                "api_key": settings.models.openrouter_api_key,
                "timeout": 90,
                "max_retries": 3
            },
            "cohere": {
                "api_key": settings.models.cohere_api_key,
                "timeout": 75,
                "max_retries": 3
            }
        }
        
        # Aplicar configurações padrão
        if provider_name in default_configs:
            for key, value in default_configs[provider_name].items():
                if key not in base_config:
                    base_config[key] = value
        
        # Aplicar configurações do usuário
        if user_config:
            base_config.update(user_config)
            
        return base_config

    @lru_cache(maxsize=1)
    def get_available_models(self) -> list[str]:
        """Retorna lista de modelos disponíveis."""
        return self._registry.get_all_models()

    def register_custom_provider(
        self,
        provider_name: str,
        llm_class: Type[AbstractLLM],
        model_patterns: list[str],
        config: Optional[Dict[str, Any]] = None,
        factory_function: Optional[LLMFactoryFunction] = None
    ) -> None:
        """
        Registra provedor customizado em tempo de execução.
        
        Args:
            provider_name: Nome único do provedor
            llm_class: Classe que implementa AbstractLLM
            model_patterns: Padrões de modelo suportados
            config: Configuração específica do provedor
            factory_function: Função de fábrica customizada
        """
        self._registry.register_provider(
            provider_name, llm_class, model_patterns, config
        )
        
        if factory_function:
            self._registry.register_factory_function(provider_name, factory_function)
        
        # Limpa cache para incluir novos modelos
        self.get_available_models.cache_clear()
        
        logger.info(f"Provedor customizado '{provider_name}' registrado")

    def get_provider_info(self) -> Dict[str, Dict[str, Any]]:
        """Retorna informações sobre todos os provedores."""
        info = {}
        
        for provider_name in self._registry.get_all_providers():
            info[provider_name] = self._registry.get_provider_info(provider_name)
        
        return info

    async def validate_model(self, model_name: str) -> bool:
        """
        Valida se um modelo pode ser criado.
        
        Args:
            model_name: Nome do modelo a validar
            
        Returns:
            True se o modelo for válido
        """
        try:
            provider_name = self._registry.get_provider_for_model(model_name)
            return provider_name is not None
        except Exception:
            return False

    def get_metrics(self) -> Dict[str, Any]:
        """Obtém métricas da fábrica."""
        return {
            **self._creation_metrics,
            "total_providers": len(self._registry.get_all_providers()),
            "total_model_patterns": len(self._registry.get_all_models()),
            "providers": list(self._registry.get_all_providers())
        }

    def _update_creation_metrics(
        self,
        provider_name: str,
        creation_time: float,
        success: bool
    ) -> None:
        """Atualiza métricas de criação."""
        if success:
            self._creation_metrics["total_created"] += 1
            
            if provider_name not in self._creation_metrics["created_by_provider"]:
                self._creation_metrics["created_by_provider"][provider_name] = 0
            self._creation_metrics["created_by_provider"][provider_name] += 1
        else:
            self._creation_metrics["creation_errors"] += 1
        
        self._creation_metrics["last_creation_time"] = creation_time

    def __repr__(self) -> str:
        """Representação string da fábrica."""
        providers = len(self._registry.get_all_providers())
        models = len(self.get_available_models())
        return f"LLMFactory(providers={providers}, models={models})"
