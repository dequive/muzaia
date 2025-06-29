# -*- coding: utf-8 -*-
"""
Pool Avançado de LLMs com Gerenciamento Inteligente.

Sistema robusto para pool de instâncias LLM com:
- Health checks automáticos
- Cleanup de instâncias ociosas
- Métricas detalhadas
- Warm-up automático
- Balanceamento de carga
"""
from __future__ import annotations

import asyncio
import logging
import time
import weakref
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import Dict, AsyncGenerator, Optional, Set, Any, List
from enum import Enum

from app.core.protocols import AbstractLLM, AbstractLLMFactory, AbstractLLMPool, LLMError

logger = logging.getLogger(__name__)


class PoolState(Enum):
    """Estados possíveis do pool."""
    INITIALIZING = "initializing"
    RUNNING = "running"
    CLOSING = "closing"
    CLOSED = "closed"
    ERROR = "error"


@dataclass
class PoolStats:
    """Estatísticas detalhadas do pool."""
    model_name: str
    total_instances: int = 0
    available_instances: int = 0
    in_use_instances: int = 0
    max_size: int = 0
    min_size: int = 0
    total_acquisitions: int = 0
    total_creations: int = 0
    total_failures: int = 0
    total_health_checks: int = 0
    failed_health_checks: int = 0
    average_acquisition_time: float = 0.0
    peak_usage: int = 0
    last_activity: Optional[float] = None
    instances_removed_idle: int = 0
    instances_removed_unhealthy: int = 0
    warmup_completed: bool = False
    
    @property
    def utilization_percentage(self) -> float:
        """Retorna porcentagem de utilização do pool."""
        if self.max_size == 0:
            return 0.0
        return (self.in_use_instances / self.max_size) * 100

    @property
    def efficiency_percentage(self) -> float:
        """Retorna eficiência do pool (reutilizações vs criações)."""
        if self.total_acquisitions == 0:
            return 0.0
        reuses = self.total_acquisitions - self.total_creations
        return (reuses / self.total_acquisitions) * 100
    
    @property
    def health_check_success_rate(self) -> float:
        """Taxa de sucesso dos health checks."""
        if self.total_health_checks == 0:
            return 100.0
        return ((self.total_health_checks - self.failed_health_checks) / self.total_health_checks) * 100


@dataclass
class PoolConfig:
    """Configuração avançada do pool."""
    max_size_per_model: int = 10
    min_size_per_model: int = 0
    idle_timeout: float = 300.0  # 5 minutos
    health_check_interval: float = 60.0  # 1 minuto
    max_acquisition_wait: float = 30.0  # 30 segundos
    enable_health_checks: bool = True
    enable_metrics: bool = True
    warmup_size: int = 2
    max_unhealthy_ratio: float = 0.3  # 30% máximo de instâncias não saudáveis
    health_check_timeout: float = 5.0
    cleanup_interval: float = 60.0  # 1 minuto
    max_creation_retries: int = 3
    creation_retry_delay: float = 2.0

    def __post_init__(self):
        """Valida configuração após inicialização."""
        if self.max_size_per_model <= 0:
            raise ValueError("max_size_per_model deve ser positivo")
        if self.min_size_per_model < 0:
            raise ValueError("min_size_per_model não pode ser negativo")
        if self.min_size_per_model > self.max_size_per_model:
            raise ValueError("min_size_per_model não pode ser maior que max_size_per_model")
        if self.warmup_size > self.max_size_per_model:
            self.warmup_size = self.max_size_per_model
        if not 0.0 <= self.max_unhealthy_ratio <= 1.0:
            raise ValueError("max_unhealthy_ratio deve estar entre 0.0 e 1.0")


class InstanceWrapper:
    """
    Wrapper avançado para instâncias LLM com metadados e lifecycle.
    """
    
    def __init__(self, instance: AbstractLLM, model_name: str):
        self.instance = instance
        self.model_name = model_name
        self.created_at = time.time()
        self.last_used = time.time()
        self.last_health_check = time.time()
        self.use_count = 0
        self.health_check_count = 0
        self.failed_health_checks = 0
        self.is_healthy = True
        self.is_in_use = False
        self.error_count = 0
        self._closed = False
        self._id = id(instance)

    async def health_check(self, timeout: float = 5.0) -> bool:
        """
        Verifica saúde da instância com timeout.
        
        Args:
            timeout: Timeout para health check
            
        Returns:
            True se instância estiver saudável
        """
        if self._closed:
            return False
        
        self.health_check_count += 1
        self.last_health_check = time.time()
        
        try:
            # Health check com timeout
            if hasattr(self.instance, 'health_check'):
                health_check_task = self.instance.health_check()
                self.is_healthy = await asyncio.wait_for(health_check_task, timeout=timeout)
            else:
                # Se não tem health check, assume saudável
                self.is_healthy = True
                
            if not self.is_healthy:
                self.failed_health_checks += 1
                logger.warning(f"Health check falhou para {self.model_name} (ID: {self._id})")
                
            return self.is_healthy
            
        except asyncio.TimeoutError:
            self.is_healthy = False
            self.failed_health_checks += 1
            logger.warning(f"Health check timeout para {self.model_name} (ID: {self._id})")
            return False
        except Exception as e:
            self.is_healthy = False
            self.failed_health_checks += 1
            self.error_count += 1
            logger.error(f"Erro no health check para {self.model_name}: {e}")
            return False

    async def close(self) -> None:
        """Fecha instância wrapper de forma segura."""
        if not self._closed:
            try:
                if hasattr(self.instance, 'close'):
                    await self.instance.close()
                logger.debug(f"Instância {self.model_name} (ID: {self._id}) fechada")
            except Exception as e:
                logger.error(f"Erro ao fechar instância {self.model_name}: {e}")
            finally:
                self._closed = True

    def touch(self) -> None:
        """Atualiza timestamp de último uso."""
        self.last_used = time.time()
        self.use_count += 1

    def mark_in_use(self) -> None:
        """Marca instância como em uso."""
        self.is_in_use = True
        self.touch()

    def mark_available(self) -> None:
        """Marca instância como disponível."""
        self.is_in_use = False

    @property
    def age(self) -> float:
        """Idade da instância em segundos."""
        return time.time() - self.created_at

    @property
    def idle_time(self) -> float:
        """Tempo ocioso em segundos."""
        return time.time() - self.last_used

    @property
    def time_since_health_check(self) -> float:
        """Tempo desde último health check."""
        return time.time() - self.last_health_check

    @property
    def health_check_success_rate(self) -> float:
        """Taxa de sucesso dos health checks."""
        if self.health_check_count == 0:
            return 100.0
        successful = self.health_check_count - self.failed_health_checks
        return (successful / self.health_check_count) * 100

    @property
    def is_stale(self) -> bool:
        """Verifica se instância está obsoleta."""
        return (self.error_count > 5 or 
                self.failed_health_checks > 3 or
                self.health_check_success_rate < 50.0)

    def __repr__(self) -> str:
        return (
            f"InstanceWrapper({self.model_name}, ID: {self._id}, "
            f"age: {self.age:.1f}s, uses: {self.use_count}, "
            f"healthy: {self.is_healthy}, in_use: {self.is_in_use})"
        )


class LLMPool(AbstractLLMPool):
    """
    Pool avançado de instâncias LLM com gerenciamento inteligente.
    
    Características:
    - Pool por modelo com tamanhos configuráveis
    - Health checks automáticos e inteligentes
    - Cleanup automático de instâncias ociosas/não saudáveis
    - Métricas detalhadas e observabilidade
    - Context manager para aquisição segura
    - Warm-up automático e otimizado
    - Balanceamento de carga
    - Recovery automático de falhas
    """

    def __init__(
        self, 
        factory: AbstractLLMFactory, 
        config: Optional[PoolConfig] = None
    ):
        """
        Inicializa pool avançado de LLMs.

        Args:
            factory: Fábrica para criar novas instâncias
            config: Configuração do pool
        """
        self._factory = factory
        self._config = config or PoolConfig()
        self._state = PoolState.INITIALIZING
        
        # Pools e tracking por modelo
        self._pools: Dict[str, asyncio.Queue[InstanceWrapper]] = {}
        self._all_instances: Dict[str, Set[InstanceWrapper]] = defaultdict(set)
        self._in_use: Dict[str, Set[InstanceWrapper]] = defaultdict(set)
        
        # Sincronização
        self._locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._global_lock = asyncio.Lock()
        
        # Métricas e estatísticas
        self._stats: Dict[str, PoolStats] = {}
        self._acquisition_times: Dict[str, List[float]] = defaultdict(list)
        self._global_metrics = {
            "total_pools": 0,
            "total_instances": 0,
            "total_acquisitions": 0,
            "total_creations": 0,
            "total_errors": 0,
            "uptime_start": time.time()
        }
        
        # Tasks de background
        self._background_tasks: Set[asyncio.Task] = set()
        self._shutdown_event = asyncio.Event()
        
        # Inicializar estado
        self._state = PoolState.RUNNING
        
        # Iniciar tasks de background
        if self._config.enable_health_checks:
            self._start_health_check_task()
        
        self._start_cleanup_task()
        
        logger.info(f"LLMPool inicializado com configuração: {self._config}")

    def _start_health_check_task(self) -> None:
        """Inicia task de health check em background."""
        task = asyncio.create_task(self._health_check_loop())
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)
        logger.debug("Task de health check iniciada")

    def _start_cleanup_task(self) -> None:
        """Inicia task de cleanup em background."""
        task = asyncio.create_task(self._cleanup_loop())
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)
        logger.debug("Task de cleanup iniciada")

    async def _health_check_loop(self) -> None:
        """Loop de health check executado em background."""
        logger.info("Health check loop iniciado")
        
        while self._state == PoolState.RUNNING:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self._config.health_check_interval)
            except asyncio.CancelledError:
                logger.info("Health check loop cancelado")
                break
            except Exception as e:
                logger.error(f"Erro no health check loop: {e}")
                await asyncio.sleep(5)

    async def _cleanup_loop(self) -> None:
        """Loop de cleanup executado em background."""
        logger.info("Cleanup loop iniciado")
        
        while self._state == PoolState.RUNNING:
            try:
                await self._cleanup_idle_instances()
                await self._cleanup_unhealthy_instances()
                await asyncio.sleep(self._config.cleanup_interval)
            except asyncio.CancelledError:
                logger.info("Cleanup loop cancelado")
                break
            except Exception as e:
                logger.error(f"Erro no cleanup loop: {e}")
                await asyncio.sleep(5)

    async def _perform_health_checks(self) -> None:
        """Executa health checks em todas as instâncias disponíveis."""
        health_check_tasks = []
        
        for model_name in list(self._pools.keys()):
            task = self._health_check_model_pool(model_name)
            health_check_tasks.append(task)
        
        if health_check_tasks:
            await asyncio.gather(*health_check_tasks, return_exceptions=True)

    async def _health_check_model_pool(self, model_name: str) -> None:
        """Executa health check para um pool específico."""
        async with self._locks[model_name]:
            pool = self._pools[model_name]
            unhealthy_instances = []
            
            # Coletar instâncias para verificar
            temp_instances = []
            while not pool.empty():
                try:
                    instance = pool.get_nowait()
                    temp_instances.append(instance)
                except asyncio.QueueEmpty:
                    break
            
            # Verificar saúde de cada instância
            for wrapper in temp_instances:
                try:
                    is_healthy = await wrapper.health_check(self._config.health_check_timeout)
                    
                    if is_healthy and not wrapper.is_stale:
                        await pool.put(wrapper)
                    else:
                        unhealthy_instances.append(wrapper)
                        if wrapper.is_stale:
                            logger.info(f"Instância obsoleta removida: {wrapper}")
                        
                except Exception as e:
                    logger.error(f"Erro no health check: {e}")
                    unhealthy_instances.append(wrapper)
            
            # Remover instâncias não saudáveis
            for wrapper in unhealthy_instances:
                await self._remove_instance(model_name, wrapper, "unhealthy")
                self._stats[model_name].instances_removed_unhealthy += 1

    async def _cleanup_idle_instances(self) -> None:
        """Remove instâncias ociosas que excederam o timeout."""
        current_time = time.time()
        
        for model_name in list(self._pools.keys()):
            async with self._locks[model_name]:
                pool = self._pools[model_name]
                total_instances = len(self._all_instances[model_name])
                min_size = self._config.min_size_per_model
                
                if total_instances <= min_size:
                    continue
                
                # Coletar instâncias para verificar idle time
                temp_instances = []
                while not pool.empty():
                    try:
                        instance = pool.get_nowait()
                        temp_instances.append(instance)
                    except asyncio.QueueEmpty:
                        break
                
                # Verificar quais podem ser removidas
                for wrapper in temp_instances:
                    idle_time = current_time - wrapper.last_used
                    
                    if (idle_time > self._config.idle_timeout and 
                        total_instances > min_size and
                        not wrapper.is_in_use):
                        
                        await self._remove_instance(model_name, wrapper, "idle")
                        total_instances -= 1
                        self._stats[model_name].instances_removed_idle += 1
                        logger.debug(
                            f"Instância ociosa removida: {model_name} "
                            f"(idle: {idle_time:.1f}s)"
                        )
                    else:
                        await pool.put(wrapper)

    async def _cleanup_unhealthy_instances(self) -> None:
        """Remove instâncias não saudáveis em excesso."""
        for model_name in list(self._pools.keys()):
            async with self._locks[model_name]:
                all_instances = list(self._all_instances[model_name])
                
                if not all_instances:
                    continue
                
                unhealthy_count = sum(1 for w in all_instances if not w.is_healthy)
                total_count = len(all_instances)
                
                if total_count > 0:
                    unhealthy_ratio = unhealthy_count / total_count
                    
                    if unhealthy_ratio > self._config.max_unhealthy_ratio:
                        # Remover instâncias mais problemáticas
                        unhealthy_instances = [w for w in all_instances if not w.is_healthy]
                        unhealthy_instances.sort(key=lambda w: w.health_check_success_rate)
                        
                        to_remove = int(len(unhealthy_instances) * 0.5)  # Remove 50% das não saudáveis
                        
                        for wrapper in unhealthy_instances[:to_remove]:
                            await self._remove_instance(model_name, wrapper, "cleanup")
                            logger.info(f"Instância problemática removida: {wrapper}")

    async def _remove_instance(
        self, 
        model_name: str, 
        wrapper: InstanceWrapper,
        reason: str = "unknown"
    ) -> None:
        """Remove uma instância do pool de forma segura."""
        try:
            self._all_instances[model_name].discard(wrapper)
            self._in_use[model_name].discard(wrapper)
            await wrapper.close()
            
            logger.debug(f"Instância removida: {model_name} (motivo: {reason})")
            
        except Exception as e:
            logger.error(f"Erro ao remover instância {model_name}: {e}")

    async def _ensure_pool_exists(self, model_name: str) -> None:
        """Garante que o pool para o modelo existe e está inicializado."""
        if model_name not in self._pools:
            async with self._global_lock:
                if model_name not in self._pools:
                    # Criar pool
                    self._pools[model_name] = asyncio.Queue(
                        maxsize=self._config.max_size_per_model
                    )
                    
                    # Inicializar estatísticas
                    self._stats[model_name] = PoolStats(
                        model_name=model_name,
                        max_size=self._config.max_size_per_model,
                        min_size=self._config.min_size_per_model
                    )
                    
                    self._global_metrics["total_pools"] += 1
                    
                    logger.info(f"Pool criado para modelo: {model_name}")
                    
                    # Warm-up do pool
                    if self._config.warmup_size > 0:
                        await self._warmup_pool(model_name)

    async def _warmup_pool(self, model_name: str) -> None:
        """Aquece pool criando instâncias iniciais."""
        try:
            warmup_size = min(self._config.warmup_size, self._config.max_size_per_model)
            created_count = 0
            
            logger.info(f"Iniciando warm-up de {warmup_size} instâncias para {model_name}")
            
            for i in range(warmup_size):
                try:
                    instance = await self._create_instance_with_retry(model_name)
                    wrapper = InstanceWrapper(instance, model_name)
                    
                    self._all_instances[model_name].add(wrapper)
                    await self._pools[model_name].put(wrapper)
                    
                    created_count += 1
                    self._stats[model_name].total_creations += 1
                    self._global_metrics["total_creations"] += 1
                    
                except Exception as e:
                    logger.warning(f"Falha no warm-up {i+1}/{warmup_size} para {model_name}: {e}")
                    break
            
            self._stats[model_name].warmup_completed = True
            logger.info(
                f"Warm-up concluído para {model_name}: "
                f"{created_count}/{warmup_size} instâncias criadas"
            )
            
        except Exception as e:
            logger.error(f"Erro no warm-up do pool {model_name}: {e}")

    async def _create_instance_with_retry(self, model_name: str) -> AbstractLLM:
        """Cria instância com retry automático."""
        last_error = None
        
        for attempt in range(self._config.max_creation_retries):
            try:
                instance = await self._factory.create_llm(model_name)
                return instance
            except Exception as e:
                last_error = e
                logger.warning(
                    f"Tentativa {attempt + 1}/{self._config.max_creation_retries} "
                    f"falhou para {model_name}: {e}"
                )
                
                if attempt < self._config.max_creation_retries - 1:
                    await asyncio.sleep(self._config.creation_retry_delay)
        
        raise LLMError(f"Falha ao criar instância após {self._config.max_creation_retries} tentativas: {last_error}")

    @asynccontextmanager
    async def acquire(self, model_name: str) -> AsyncGenerator[AbstractLLM, None]:
        """
        Adquire instância de LLM do pool de forma segura.

        Args:
            model_name: Nome do modelo a ser adquirido

        Yields:
            Instância de cliente LLM pronta para uso

        Raises:
            LLMError: Se não conseguir adquirir uma instância
        """
        if self._state != PoolState.RUNNING:
            raise LLMError(f"Pool não está em execução (estado: {self._state.value})")

        start_time = time.time()
        wrapper = None
        
        try:
            await self._ensure_pool_exists(model_name)
            
            async with self._locks[model_name]:
                pool = self._pools[model_name]
                
                # Tentar obter instância existente
                try:
                    wrapper = pool.get_nowait()
                    logger.debug(f"Instância reutilizada: {model_name}")
                except asyncio.QueueEmpty:
                    # Criar nova instância se possível
                    current_instances = len(self._all_instances[model_name])
                    if current_instances < self._config.max_size_per_model:
                        try:
                            instance = await self._create_instance_with_retry(model_name)
                            wrapper = InstanceWrapper(instance, model_name)
                            self._all_instances[model_name].add(wrapper)
                            self._stats[model_name].total_creations += 1
                            self._global_metrics["total_creations"] += 1
                            logger.debug(f"Nova instância criada: {model_name}")
                        except Exception as e:
                            logger.error(f"Erro ao criar nova instância: {e}")
                            raise LLMError(f"Erro ao criar instância: {e}")
                
                # Se ainda não temos instância, esperar por uma
                if not wrapper:
                    logger.debug(f"Aguardando instância disponível: {model_name}")
                    try:
                        wrapper = await asyncio.wait_for(
                            pool.get(),
                            timeout=self._config.max_acquisition_wait
                        )
                    except asyncio.TimeoutError:
                        raise LLMError(
                            f"Timeout ao adquirir instância de {model_name} "
                            f"(aguardou {self._config.max_acquisition_wait}s)"
                        )
                
                # Marcar como em uso e atualizar estatísticas
                wrapper.mark_in_use()
                self._in_use[model_name].add(wrapper)
                
                # Atualizar métricas
                acquisition_time = time.time() - start_time
                self._update_metrics(model_name, acquisition_time)

            yield wrapper.instance

        except Exception as e:
            self._stats[model_name].total_failures += 1
            self._global_metrics["total_errors"] += 1
            
            if isinstance(e, LLMError):
                raise
            raise LLMError(f"Erro ao adquirir instância de {model_name}: {e}") from e
        
        finally:
            if wrapper:
                await self._release_instance(model_name, wrapper)

    async def _release_instance(self, model_name: str, wrapper: InstanceWrapper) -> None:
        """Libera instância de volta para o pool."""
        try:
            async with self._locks[model_name]:
                wrapper.mark_available()
                self._in_use[model_name].discard(wrapper)
                
                # Verificar se instância ainda é válida
                if (wrapper in self._all_instances[model_name] and 
                    self._state == PoolState.RUNNING and
                    not wrapper.is_stale):
                    
                    await self._pools[model_name].put(wrapper)
                    logger.debug(f"Instância liberada: {model_name}")
                else:
                    # Remover instância se não for mais válida
                    await self._remove_instance(model_name, wrapper, "release_invalid")
                    
        except Exception as e:
            logger.error(f"Erro ao liberar instância {model_name}: {e}")

    def _update_metrics(self, model_name: str, acquisition_time: float) -> None:
        """Atualiza métricas do pool."""
        if not self._config.enable_metrics:
            return
            
        stats = self._stats[model_name]
        stats.total_acquisitions += 1
        stats.last_activity = time.time()
        
        self._global_metrics["total_acquisitions"] += 1
        
        # Atualizar tempo médio de aquisição
        times = self._acquisition_times[model_name]
        times.append(acquisition_time)
        
        # Manter apenas os últimos 100 tempos
        if len(times) > 100:
            times.pop(0)
        
        stats.average_acquisition_time = sum(times) / len(times)
        
        # Atualizar pico de uso
        current_usage = len(self._in_use[model_name])
        if current_usage > stats.peak_usage:
            stats.peak_usage = current_usage

    async def close_all(self) -> None:
        """Fecha todas as instâncias e limpa recursos."""
        if self._state == PoolState.CLOSED:
            return
            
        logger.info("Iniciando fechamento do pool...")
        self._state = PoolState.CLOSING
        
        # Sinalizar shutdown para tasks
        self._shutdown_event.set()
        
        # Cancelar tasks de background
        for task in self._background_tasks:
            task.cancel()
        
        if self._background_tasks:
            await asyncio.gather(*self._background_tasks, return_exceptions=True)
        
        # Fechar todas as instâncias
        async with self._global_lock:
            close_tasks = []
            
            for model_name in list(self._all_instances.keys()):
                for wrapper in self._all_instances[model_name].copy():
                    close_tasks.append(wrapper.close())
                
                self._all_instances[model_name].clear()
                self._in_use[model_name].clear()
                
                # Limpar queue
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
        """Retorna número total de instâncias no pool."""
        return sum(len(instances) for instances in self._all_instances.values())

    @property
    def available(self) -> int:
        """Retorna número de instâncias disponíveis."""
        return sum(pool.qsize() for pool in self._pools.values())

    def get_stats(self) -> Dict[str, PoolStats]:
        """Retorna estatísticas detalhadas do pool."""
        # Atualizar estatísticas atuais
        for model_name, stats in self._stats.items():
            stats.total_instances = len(self._all_instances[model_name])
            stats.available_instances = (
                self._pools[model_name].qsize() 
                if model_name in self._pools else 0
            )
            stats.in_use_instances = len(self._in_use[model_name])
        
        return self._stats.copy()

    def get_model_stats(self, model_name: str) -> Optional[PoolStats]:
        """Retorna estatísticas para um modelo específico."""
        return self._stats.get(model_name)

    def get_global_metrics(self) -> Dict[str, Any]:
        """Retorna métricas globais do pool."""
        uptime = time.time() - self._global_metrics["uptime_start"]
        
        return {
            **self._global_metrics,
            "uptime": uptime,
            "state": self._state.value,
            "total_models": len(self._pools),
            "total_instances_current": self.size,
            "total_available_current": self.available,
            "background_tasks": len(self._background_tasks),
            "config": {
                "max_size_per_model": self._config.max_size_per_model,
                "min_size_per_model": self._config.min_size_per_model,
                "idle_timeout": self._config.idle_timeout,
                "health_check_interval": self._config.health_check_interval
            }
        }

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
            current_instances = len(self._all_instances[model_name])
            max_to_create = min(
                count,
                self._config.max_size_per_model - current_instances
            )
            
            logger.info(f"Pré-carregando {max_to_create} instâncias de {model_name}")
            
            for i in range(max_to_create):
                try:
                    instance = await self._create_instance_with_retry(model_name)
                    wrapper = InstanceWrapper(instance, model_name)
                    
                    self._all_instances[model_name].add(wrapper)
                    await self._pools[model_name].put(wrapper)
                    
                    self._stats[model_name].total_creations += 1
                    self._global_metrics["total_creations"] += 1
                    created += 1
                    
                except Exception as e:
                    logger.error(f"Erro ao pré-carregar instância {i+1}: {e}")
                    break
        
        logger.info(f"Pré-carregadas {created}/{max_to_create} instâncias de {model_name}")
        return created

    async def validate_model(self, model_name: str) -> bool:
        """
        Valida se um modelo pode ser usado pelo pool.
        
        Args:
            model_name: Nome do modelo a validar
            
        Returns:
            True se o modelo for válido
        """
        try:
            return await self._factory.validate_model(model_name)
        except Exception:
            return False

    def __repr__(self) -> str:
        """Representação string do pool."""
        return (
            f"LLMPool(models={len(self._pools)}, "
            f"instances={self.size}, "
            f"available={self.available}, "
            f"state={self._state.value})"
        )
