# -*- coding: utf-8 -*-
"""
Módulo do Pool de LLMs.

Implementa um pool robusto para gerenciar e reutilizar instâncias de clientes LLM,
otimizando o desempenho, uso de recursos e fornecendo monitoramento detalhado.
"""
from __future__ import annotations

import asyncio
import logging
import time
import weakref
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import Dict, AsyncGenerator, Optional, Set, Any
from enum import Enum

from app.core.protocols import AbstractLLM, AbstractLLMFactory, AbstractLLMPool, LLMError

logger = logging.getLogger(__name__)


class PoolState(Enum):
    """Estados possíveis do pool."""
    RUNNING = "running"
    CLOSING = "closing"
    CLOSED = "closed"


@dataclass
class PoolStats:
    """Estatísticas detalhadas do pool."""
    model_name: str
    total_instances: int = 0
    available_instances: int = 0
    in_use_instances: int = 0
    max_size: int = 0
    total_acquisitions: int = 0
    total_creations: int = 0
    total_failures: int = 0
    average_acquisition_time: float = 0.0
    peak_usage: int = 0
    last_activity: Optional[float] = None
    
    @property
    def utilization_percentage(self) -> float:
        """Retorna a porcentagem de utilização do pool."""
        if self.max_size == 0:
            return 0.0
        return (self.in_use_instances / self.max_size) * 100

    @property
    def efficiency_percentage(self) -> float:
        """Retorna a eficiência do pool (reutilizações vs criações)."""
        if self.total_acquisitions == 0:
            return 0.0
        reuses = self.total_acquisitions - self.total_creations
        return (reuses / self.total_acquisitions) * 100


@dataclass
class PoolConfig:
    """Configuração do pool."""
    max_size_per_model: int = 10
    min_size_per_model: int = 0
    idle_timeout: float = 300.0  # 5 minutos
    health_check_interval: float = 60.0  # 1 minuto
    max_acquisition_wait: float = 30.0  # 30 segundos
    enable_health_checks: bool = True
    enable_metrics: bool = True
    warmup_size: int = 2  # Instâncias para criar imediatamente

    def __post_init__(self):
        """Valida a configuração."""
        if self.max_size_per_model <= 0:
            raise ValueError("max_size_per_model deve ser positivo")
        if self.min_size_per_model < 0:
            raise ValueError("min_size_per_model não pode ser negativo")
        if self.min_size_per_model > self.max_size_per_model:
            raise ValueError("min_size_per_model não pode ser maior que max_size_per_model")
        if self.warmup_size > self.max_size_per_model:
            self.warmup_size = self.max_size_per_model


class InstanceWrapper:
    """Wrapper para instâncias LLM com metadados."""
    
    def __init__(self, instance: AbstractLLM, model_name: str):
        self.instance = instance
        self.model_name = model_name
        self.created_at = time.time()
        self.last_used = time.time()
        self.use_count = 0
        self.is_healthy = True
        self._closed = False

    async def health_check(self) -> bool:
        """Verifica a saúde da instância."""
        try:
            if self._closed:
                return False
            
            # Usa health_check se disponível, senão assume saudável
            if hasattr(self.instance, 'health_check'):
                self.is_healthy = await self.instance.health_check()
            else:
                self.is_healthy = True
                
            return self.is_healthy
        except Exception as e:
            logger.warning(f"Health check falhou para {self.model_name}: {e}")
            self.is_healthy = False
            return False

    async def close(self):
        """Fecha a instância wrapper."""
        if not self._closed:
            try:
                await self.instance.close()
            except Exception as e:
                logger.error(f"Erro ao fechar instância {self.model_name}: {e}")
            finally:
                self._closed = True

    def touch(self):
        """Atualiza timestamp de último uso."""
        self.last_used = time.time()
        self.use_count += 1

    @property
    def age(self) -> float:
        """Idade da instância em segundos."""
        return time.time() - self.created_at

    @property
    def idle_time(self) -> float:
        """Tempo ocioso em segundos."""
        return time.time() - self.last_used

    def __repr__(self) -> str:
        return f"InstanceWrapper({self.model_name}, age={self.age:.1f}s, uses={self.use_count})"


class LLMPool(AbstractLLMPool):
    """
    Implementação robusta de um pool de instâncias de LLM.

    Características:
    - Pool por modelo com tamanhos configuráveis
    - Health checks automáticos
    - Cleanup de instâncias ociosas
    - Métricas detalhadas
    - Context manager para aquisição segura
    - Warmup automático
    """

    def __init__(
        self, 
        factory: AbstractLLMFactory, 
        config: Optional[PoolConfig] = None
    ):
        """
        Inicializa o pool de LLMs.

        Args:
            factory: Fábrica para criar novas instâncias de LLM
            config: Configuração do pool (usa padrões se não fornecida)
        """
        self._factory = factory
        self._config = config or PoolConfig()
        self._state = PoolState.RUNNING
        
        # Pools por modelo
        self._pools: Dict[str, asyncio.Queue[InstanceWrapper]] = {}
        self._all_instances: Dict[str, Set[InstanceWrapper]] = defaultdict(set)
        self._in_use: Dict[str, Set[InstanceWrapper]] = defaultdict(set)
        
        # Sincronização
        self._locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._global_lock = asyncio.Lock()
        
        # Métricas
        self._stats: Dict[str, PoolStats] = {}
        self._acquisition_times: Dict[str, list[float]] = defaultdict(list)
        
        # Tasks de background
        self._background_tasks: Set[asyncio.Task] = set()
        
        if self._config.enable_health_checks:
            self._start_health_check_task()
        
        self._start_cleanup_task()
        
        logger.info(f"LLMPool inicializado: {self._config}")

    def _start_health_check_task(self):
        """Inicia task de health check em background."""
        task = asyncio.create_task(self._health_check_loop())
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)

    def _start_cleanup_task(self):
        """Inicia task de cleanup em background."""
        task = asyncio.create_task(self._cleanup_loop())
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)

    async def _health_check_loop(self):
        """Loop de health check executado em background."""
        while self._state == PoolState.RUNNING:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self._config.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Erro no health check loop: {e}")
                await asyncio.sleep(5)  # Espera antes de tentar novamente

    async def _cleanup_loop(self):
        """Loop de cleanup executado em background."""
        while self._state == PoolState.RUNNING:
            try:
                await self._cleanup_idle_instances()
                await asyncio.sleep(self._config.idle_timeout / 4)  # Check mais frequente
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Erro no cleanup loop: {e}")
                await asyncio.sleep(5)

    async def _perform_health_checks(self):
        """Executa health checks em todas as instâncias."""
        for model_name in list(self._pools.keys()):
            async with self._locks[model_name]:
                pool = self._pools[model_name]
                unhealthy_instances = []
                
                # Coleta instâncias para verificar
                temp_instances = []
                while not pool.empty():
                    try:
                        instance = pool.get_nowait()
                        temp_instances.append(instance)
                    except asyncio.QueueEmpty:
                        break
                
                # Verifica saúde de cada instância
                for wrapper in temp_instances:
                    try:
                        is_healthy = await asyncio.wait_for(
                            wrapper.health_check(),
                            timeout=5.0
                        )
                        
                        if is_healthy:
                            await pool.put(wrapper)
                        else:
                            unhealthy_instances.append(wrapper)
                            
                    except asyncio.TimeoutError:
                        logger.warning(f"Health check timeout para {model_name}")
                        unhealthy_instances.append(wrapper)
                    except Exception as e:
                        logger.error(f"Erro no health check: {e}")
                        unhealthy_instances.append(wrapper)
                
                # Remove instâncias não saudáveis
                for wrapper in unhealthy_instances:
                    await self._remove_instance(model_name, wrapper)
                    logger.info(f"Instância não saudável removida: {model_name}")

    async def _cleanup_idle_instances(self):
        """Remove instâncias ociosas que excederam o timeout."""
        current_time = time.time()
        
        for model_name in list(self._pools.keys()):
            async with self._locks[model_name]:
                pool = self._pools[model_name]
                total_instances = len(self._all_instances[model_name])
                min_size = self._config.min_size_per_model
                
                if total_instances <= min_size:
                    continue
                
                # Coleta instâncias para verificar idle time
                temp_instances = []
                while not pool.empty():
                    try:
                        instance = pool.get_nowait()
                        temp_instances.append(instance)
                    except asyncio.QueueEmpty:
                        break
                
                # Verifica quais podem ser removidas
                for wrapper in temp_instances:
                    idle_time = current_time - wrapper.last_used
                    
                    if (idle_time > self._config.idle_timeout and 
                        total_instances > min_size):
                        await self._remove_instance(model_name, wrapper)
                        total_instances -= 1
                        logger.debug(f"Instância ociosa removida: {model_name} (idle: {idle_time:.1f}s)")
                    else:
                        await pool.put(wrapper)

    async def _remove_instance(self, model_name: str, wrapper: InstanceWrapper):
        """Remove uma instância do pool."""
        try:
            self._all_instances[model_name].discard(wrapper)
            self._in_use[model_name].discard(wrapper)
            await wrapper.close()
        except Exception as e:
            logger.error(f"Erro ao remover instância {model_name}: {e}")

    async def _ensure_pool_exists(self, model_name: str):
        """Garante que o pool para o modelo existe."""
        if model_name not in self._pools:
            async with self._global_lock:
                if model_name not in self._pools:
                    self._pools[model_name] = asyncio.Queue(maxsize=self._config.max_size_per_model)
                    self._stats[model_name] = PoolStats(model_name=model_name, max_size=self._config.max_size_per_model)
                    
                    # Warmup do pool
                    if self._config.warmup_size > 0:
                        await self._warmup_pool(model_name)

    async def _warmup_pool(self, model_name: str):
        """Aquece o pool criando instâncias iniciais."""
        try:
            warmup_size = min(self._config.warmup_size, self._config.max_size_per_model)
            
            for _ in range(warmup_size):
                try:
                    instance = await self._factory.create_llm(model_name)
                    wrapper = InstanceWrapper(instance, model_name)
                    
                    self._all_instances[model_name].add(wrapper)
                    await self._pools[model_name].put(wrapper)
                    
                    self._stats[model_name].total_creations += 1
                    
                except Exception as e:
                    logger.warning(f"Erro no warmup para {model_name}: {e}")
                    break
            
            logger.info(f"Pool aquecido para {model_name}: {len(self._all_instances[model_name])} instâncias")
            
        except Exception as e:
            logger.error(f"Erro no warmup do pool {model_name}: {e}")

    @asynccontextmanager
    async def acquire(self, model_name: str) -> AsyncGenerator[AbstractLLM, None]:
        """
        Adquire uma instância de LLM do pool de forma segura.

        Args:
            model_name: Nome do modelo a ser adquirido

        Yields:
            Instância de cliente LLM pronta para uso

        Raises:
            LLMError: Se não for possível adquirir uma instância
        """
        if self._state != PoolState.RUNNING:
            raise LLMError("Pool está fechado ou fechando")

        start_time = time.time()
        wrapper = None
        
        try:
            await self._ensure_pool_exists(model_name)
            
            async with self._locks[model_name]:
                pool = self._pools[model_name]
                
                # Tenta obter instância existente
                try:
                    wrapper = pool.get_nowait()
                    logger.debug(f"Instância reutilizada: {model_name}")
                except asyncio.QueueEmpty:
                    # Cria nova instância se possível
                    if len(self._all_instances[model_name]) < self._config.max_size_per_model:
                        instance = await self._factory.create_llm(model_name)
                        wrapper = InstanceWrapper(instance, model_name)
                        self._all_instances[model_name].add(wrapper)
                        self._stats[model_name].total_creations += 1
                        logger.debug(f"Nova instância criada: {model_name}")
                
                # Se ainda não temos instância, espera por uma
                if not wrapper:
                    logger.debug(f"Aguardando instância disponível: {model_name}")
                    try:
                        wrapper = await asyncio.wait_for(
                            pool.get(),
                            timeout=self._config.max_acquisition_wait
                        )
                    except asyncio.TimeoutError:
                        raise LLMError(f"Timeout ao adquirir instância de {model_name}")
                
                # Marca como em uso
                self._in_use[model_name].add(wrapper)
                wrapper.touch()
                
                # Atualiza métricas
                acquisition_time = time.time() - start_time
                self._update_metrics(model_name, acquisition_time)

            yield wrapper.instance

        except Exception as e:
            self._stats[model_name].total_failures += 1
            if isinstance(e, LLMError):
                raise
            raise LLMError(f"Erro ao adquirir instância de {model_name}: {e}") from e
        
        finally:
            if wrapper:
                await self._release_instance(model_name, wrapper)

    async def _release_instance(self, model_name: str, wrapper: InstanceWrapper):
        """Libera uma instância de volta para o pool."""
        try:
            async with self._locks[model_name]:
                self._in_use[model_name].discard(wrapper)
                
                if wrapper in self._all_instances[model_name] and self._state == PoolState.RUNNING:
                    await self._pools[model_name].put(wrapper)
                    logger.debug(f"Instância liberada: {model_name}")
                else:
                    await wrapper.close()
                    
        except Exception as e:
            logger.error(f"Erro ao liberar instância {model_name}: {e}")

    def _update_metrics(self, model_name: str, acquisition_time: float):
        """Atualiza métricas do pool."""
        if not self._config.enable_metrics:
            return
            
        stats = self._stats[model_name]
        stats.total_acquisitions += 1
        stats.last_activity = time.time()
        
        # Atualiza tempo médio de aquisição
        times = self._acquisition_times[model_name]
        times.append(acquisition_time)
        
        # Mantém apenas os últimos 100 tempos
        if len(times) > 100:
            times.pop(0)
        
        stats.average_acquisition_time = sum(times) / len(times)
        
        # Atualiza pico de uso
        current_usage = len(self._in_use[model_name])
        if current_usage > stats.peak_usage:
            stats.peak_usage = current_usage

    async def close_all(self) -> None:
        """Fecha todas as instâncias de LLM geridas pelo pool."""
        if self._state != PoolState.RUNNING:
            return
            
        self._state = PoolState.CLOSING
        logger.info("Iniciando fechamento do pool...")
        
        # Cancela tasks de background
        for task in self._background_tasks:
            task.cancel()
        
        if self._background_tasks:
            await asyncio.gather(*self._background_tasks, return_exceptions=True)
        
        # Fecha todas as instâncias
        async with self._global_lock:
            close_tasks = []
            
            for model_name in list(self._all_instances.keys()):
                for wrapper in self._all_instances[model_name].copy():
                    close_tasks.append(wrapper.close())
                
                self._all_instances[model_name].clear()
                self._in_use[model_name].clear()
                
                # Limpa a queue
                pool = self._pools[model_name]
                while not pool.empty():
                    try:
                        pool.get_nowait()
                    except asyncio.QueueEmpty:
                        break
            
            if close_tasks:
                await asyncio.gather(*close_tasks, return_exceptions=True)
            
            self._pools.clear()
            
        self._state = PoolState.CLOSED
        logger.info("Pool fechado com sucesso")

    @property
    def size(self) -> int:
        """Retorna o número total de instâncias no pool."""
        return sum(len(instances) for instances in self._all_instances.values())

    @property
    def available(self) -> int:
        """Retorna o número de instâncias disponíveis."""
        return sum(pool.qsize() for pool in self._pools.values())

    def get_stats(self) -> Dict[str, PoolStats]:
        """Retorna estatísticas detalhadas do pool."""
        for model_name, stats in self._stats.items():
            stats.total_instances = len(self._all_instances[model_name])
            stats.available_instances = self._pools[model_name].qsize() if model_name in self._pools else 0
            stats.in_use_instances = len(self._in_use[model_name])
        
        return self._stats.copy()

    def get_model_stats(self, model_name: str) -> Optional[PoolStats]:
        """Retorna estatísticas para um modelo específico."""
        return self._stats.get(model_name)

    async def preload_model(self, model_name: str, count: int = 1) -> int:
        """
        Pré-carrega instâncias de um modelo específico.
        
        Args:
            model_name: Nome do modelo
            count: Número de instâncias a criar
            
        Returns:
            Número de instâncias criadas com sucesso
        """
        await self._ensure_pool_exists(model_name)
        created = 0
        
        async with self._locks[model_name]:
            max_to_create = min(
                count,
                self._config.max_size_per_model - len(self._all_instances[model_name])
            )
            
            for _ in range(max_to_create):
                try:
                    instance = await self._factory.create_llm(model_name)
                    wrapper = InstanceWrapper(instance, model_name)
                    
                    self._all_instances[model_name].add(wrapper)
                    await self._pools[model_name].put(wrapper)
                    
                    self._stats[model_name].total_creations += 1
                    created += 1
                    
                except Exception as e:
                    logger.error(f"Erro ao pré-carregar {model_name}: {e}")
                    break
        
        logger.info(f"Pré-carregadas {created} instâncias de {model_name}")
        return created

    def __repr__(self) -> str:
        """Representação string do pool."""
        return (f"LLMPool(models={len(self._pools)}, "
                f"total_instances={self.size}, "
                f"available={self.available}, "
                f"state={self._state.value})")
