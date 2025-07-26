# -*- coding: utf-8 -*-
"""
Módulo da Classe Base Abstrata para Modelos de Linguagem.

Implementa funcionalidades comuns para todos os clientes LLM,
incluindo gerenciamento de sessão HTTP, logging, métricas
e lifecycle management.
"""
import asyncio
import logging
import time
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, AsyncGenerator, Type
from types import TracebackType

import aiohttp

from app.core.protocols import AbstractLLM, LLMStreamChunk
from app.schemas import LLMResponse, GenerationParams
from app.core.exceptions import LLMConnectionError, LLMTimeoutError
from app.core.resilience import retry_with_backoff, RetryConfig
from app.core.cache import cache_result


class BaseLLM(AbstractLLM, ABC):
    """
    Implementação base para o protocolo AbstractLLM.
    
    Características:
    - Gerenciamento automático de sessão aiohttp
    - Context manager para lifecycle
    - Retry automático com backoff
    - Logging estruturado
    - Métricas básicas
    - Health checking
    - Cache de informações do modelo
    """

    def __init__(
        self,
        model_name: str,
        session: Optional[aiohttp.ClientSession] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        base_delay: float = 1.0,
        **kwargs
    ):
        """
        Inicializa cliente LLM base.
        
        Args:
            model_name: Nome do modelo
            session: Sessão HTTP externa (opcional)
            timeout: Timeout para requisições
            max_retries: Número máximo de tentativas
            base_delay: Delay inicial para retry
            **kwargs: Argumentos adicionais específicos do provedor
        """
        self._model_name = model_name
        self._session = session
        self._owns_session = session is None
        self._timeout = timeout
        self._max_retries = max_retries
        self._base_delay = base_delay
        
        # Configuração de retry
        self._retry_config = RetryConfig(
            max_attempts=max_retries,
            base_delay=base_delay,
            max_delay=60.0,
            backoff_factor=2.0,
            jitter=True
        )
        
        # Logging específico por instância
        self.log = logging.getLogger(f"{__name__}.{self.__class__.__name__}.{model_name}")
        
        # Métricas básicas
        self._metrics = {
            "requests_total": 0,
            "requests_successful": 0,
            "requests_failed": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "avg_response_time": 0.0,
            "last_used": None,
            "health_checks": 0,
            "health_check_failures": 0
        }
        
        # Estado
        self._initialized = False
        self._closed = False
        
        self.log.debug(f"Cliente LLM '{model_name}' inicializado")

    @property
    def model_name(self) -> str:
        """Nome do modelo."""
        return self._model_name

    @property
    @abstractmethod
    def provider(self) -> str:
        """Nome do provedor (deve ser implementado pelas subclasses)."""
        pass

    # Métodos abstratos que devem ser implementados pelas subclasses
    @abstractmethod
    async def _generate_impl(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """
        Implementação específica da geração.
        
        Este método deve ser implementado por cada provedor específico.
        """
        pass

    @abstractmethod
    async def _stream_generate_impl(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        """
        Implementação específica do streaming.
        
        Este método deve ser implementado por cada provedor específico.
        """
        yield  # Necessário para sintaxe de generator

    @abstractmethod
    async def _health_check_impl(self) -> bool:
        """
        Implementação específica do health check.
        
        Este método deve ser implementado por cada provedor específico.
        """
        pass

    @abstractmethod
    async def _get_model_info_impl(self) -> Dict[str, Any]:
        """
        Implementação específica para obter informações do modelo.
        
        Este método deve ser implementado por cada provedor específico.
        """
        pass

    # Implementações públicas do protocolo AbstractLLM
    async def generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """
        Gera resposta usando o modelo LLM com retry e métricas.
        """
        if self._closed:
            raise LLMConnectionError("Cliente LLM está fechado", self.model_name)
        
        await self._ensure_session()
        
        start_time = time.time()
        self._metrics["requests_total"] += 1
        
        try:
            # Executar com retry
            response = await retry_with_backoff(
                lambda: self._generate_impl(prompt, context, system_prompt, params),
                config=self._retry_config,
                exceptions=(LLMConnectionError, LLMTimeoutError),
                on_retry=self._log_retry
            )
            
            # Atualizar métricas de sucesso
            processing_time = time.time() - start_time
            self._update_success_metrics(response, processing_time)
            
            self.log.debug(
                f"Geração bem-sucedida em {processing_time:.3f}s "
                f"({response.tokens_used or 0} tokens)"
            )
            
            return response
            
        except Exception as e:
            # Atualizar métricas de erro
            processing_time = time.time() - start_time
            self._update_error_metrics(e, processing_time)
            
            self.log.error(f"Erro na geração de resposta: {str(e)}", 
                          error_type=type(e).__name__, 
                          processing_time=processing_time)
            raise

    async def stream_generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        """
        Gera resposta em streaming com error handling.
        """
        if self._closed:
            raise LLMConnectionError("Cliente LLM está fechado", self.model_name)
        
        await self._ensure_session()
        
        start_time = time.time()
        self._metrics["requests_total"] += 1
        token_count = 0
        
        try:
            async for chunk in self._stream_generate_impl(prompt, context, system_prompt, params):
                # Contar tokens (estimativa)
                if chunk.get("content"):
                    token_count += len(chunk["content"].split())
                
                # Adicionar metadados
                chunk["model"] = self.model_name
                chunk["processing_time"] = time.time() - start_time
                chunk["token_count"] = token_count
                
                yield chunk
                
                # Se é chunk final, atualizar métricas
                if chunk.get("is_final", False):
                    processing_time = time.time() - start_time
                    self._metrics["requests_successful"] += 1
                    self._metrics["total_tokens"] += token_count
                    self._update_avg_response_time(processing_time)
                    self._metrics["last_used"] = time.time()
                    
                    self.log.debug(
                        f"Stream concluído em {processing_time:.3f}s "
                        f"({token_count} tokens estimados)"
                    )
                    
        except Exception as e:
            processing_time = time.time() - start_time
            self._update_error_metrics(e, processing_time)
            
            self.log.error(f"Erro no streaming após {processing_time:.3f}s: {e}")
            
            # Enviar chunk de erro
            yield {
                "content": "",
                "is_final": True,
                "error": str(e),
                "model": self.model_name,
                "processing_time": processing_time
            }

    async def health_check(self) -> bool:
        """
        Verifica saúde do modelo com timeout e métricas.
        """
        if self._closed:
            return False
        
        await self._ensure_session()
        
        self._metrics["health_checks"] += 1
        start_time = time.time()
        
        try:
            # Health check com timeout específico
            is_healthy = await asyncio.wait_for(
                self._health_check_impl(),
                timeout=10.0  # Timeout mais curto para health check
            )
            
            check_time = time.time() - start_time
            
            if is_healthy:
                self.log.debug(f"Health check OK em {check_time:.3f}s")
            else:
                self._metrics["health_check_failures"] += 1
                self.log.warning(f"Health check falhou em {check_time:.3f}s")
            
            return is_healthy
            
        except asyncio.TimeoutError:
            self._metrics["health_check_failures"] += 1
            self.log.warning("Health check timeout")
            return False
        except Exception as e:
            self._metrics["health_check_failures"] += 1
            self.log.error(f"Erro no health check: {e}")
            return False

    @cache_result(ttl=300, namespace="model_info")  # Cache por 5 minutos
    async def get_model_info(self) -> Dict[str, Any]:
        """
        Obtém informações do modelo com cache.
        """
        if self._closed:
            raise LLMConnectionError("Cliente LLM está fechado", self.model_name)
        
        await self._ensure_session()
        
        try:
            info = await self._get_model_info_impl()
            
            # Enriquecer com informações base
            info.update({
                "model_name": self.model_name,
                "provider": self.provider,
                "client_metrics": self.get_metrics(),
                "last_updated": time.time()
            })
            
            return info
            
        except Exception as e:
            self.log.error(f"Erro ao obter informações do modelo: {e}")
            # Retornar informações básicas em caso de erro
            return {
                "model_name": self.model_name,
                "provider": self.provider,
                "available": False,
                "error": str(e),
                "last_updated": time.time()
            }

    async def close(self) -> None:
        """
        Fecha recursos do cliente LLM de forma segura.
        """
        if self._closed:
            return
        
        try:
            # Fechar sessão apenas se foi criada por esta instância
            if self._session and not self._session.closed and self._owns_session:
                await self._session.close()
                self.log.debug("Sessão HTTP fechada")
            
            self._closed = True
            self.log.info(f"Cliente LLM '{self.model_name}' fechado")
            
        except Exception as e:
            self.log.error(f"Erro ao fechar cliente LLM: {e}")

    def get_metrics(self) -> Dict[str, Any]:
        """
        Retorna métricas do cliente LLM.
        """
        success_rate = 0.0
        if self._metrics["requests_total"] > 0:
            success_rate = (
                self._metrics["requests_successful"] / 
                self._metrics["requests_total"] * 100
            )
        
        health_success_rate = 100.0
        if self._metrics["health_checks"] > 0:
            health_success_rate = (
                (self._metrics["health_checks"] - self._metrics["health_check_failures"]) /
                self._metrics["health_checks"] * 100
            )
        
        return {
            **self._metrics,
            "success_rate": success_rate,
            "health_success_rate": health_success_rate,
            "model_name": self.model_name,
            "provider": self.provider,
            "is_closed": self._closed,
            "owns_session": self._owns_session
        }

    # Context manager support
    async def __aenter__(self) -> "BaseLLM":
        """
        Context manager entry: cria sessão se necessário.
        """
        await self._ensure_session()
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> Optional[bool]:
        """
        Context manager exit: garante limpeza de recursos.
        """
        await self.close()
        return None

    # Métodos utilitários privados
    async def _ensure_session(self) -> None:
        """
        Garante que existe uma sessão HTTP válida.
        """
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self._timeout),
                connector=aiohttp.TCPConnector(
                    limit=10,
                    ttl_dns_cache=300,
                    use_dns_cache=True
                )
            )
            self._owns_session = True
            self.log.debug("Nova sessão HTTP criada")

    def _update_success_metrics(self, response: LLMResponse, processing_time: float):
        """Atualiza métricas de sucesso."""
        self._metrics["requests_successful"] += 1
        
        if response.tokens_used:
            self._metrics["total_tokens"] += response.tokens_used
        
        if response.cost:
            self._metrics["total_cost"] += response.cost
        
        self._update_avg_response_time(processing_time)
        self._metrics["last_used"] = time.time()

    def _update_error_metrics(self, error: Exception, processing_time: float):
        """Atualiza métricas de erro."""
        self._metrics["requests_failed"] += 1
        self._update_avg_response_time(processing_time)

    def _update_avg_response_time(self, new_time: float):
        """Atualiza tempo médio de resposta."""
        total_requests = self._metrics["requests_total"]
        current_avg = self._metrics["avg_response_time"]
        
        if total_requests > 0:
            new_avg = ((current_avg * (total_requests - 1)) + new_time) / total_requests
            self._metrics["avg_response_time"] = new_avg

    async def _log_retry(self, attempt: int, error: Exception, delay: float):
        """Callback para logging de retry."""
        self.log.warning(
            f"Tentativa {attempt + 1} falhou ({error}), "
            f"tentando novamente em {delay:.2f}s"
        )

    def __repr__(self) -> str:
        """Representação string do cliente."""
        status = "closed" if self._closed else "open"
        return (
            f"{self.__class__.__name__}("
            f"model='{self.model_name}', "
            f"provider='{self.provider}', "
            f"status='{status}')"
        )
