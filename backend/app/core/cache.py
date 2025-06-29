# -*- coding: utf-8 -*-
"""
Módulo de Cache Assíncrono em Memória Avançado.

Fornece uma implementação enterprise de cache segura para ambientes concorrentes,
com TTL (Time-To-Live), limite de tamanho, múltiplas políticas de eviction,
compressão opcional e métricas detalhadas.
"""
import asyncio
import time
import logging
import pickle
import gzip
import hashlib
from typing import Dict, Any, Optional, List, Union, Callable
from dataclasses import dataclass, field
from collections import deque, OrderedDict
from enum import Enum
import json

from app.core.config import settings

logger = logging.getLogger(__name__)


class EvictionPolicy(Enum):
    """Políticas de eviction disponíveis."""
    FIFO = "fifo"  # First In, First Out
    LRU = "lru"    # Least Recently Used
    LFU = "lfu"    # Least Frequently Used


@dataclass
class CacheEntry:
    """Estrutura de dados para uma entrada no cache."""
    value: Any
    expiration_time: float
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    access_count: int = 0
    size_bytes: int = 0
    compressed: bool = False


@dataclass
class CacheStats:
    """Estatísticas do cache."""
    hits: int = 0
    misses: int = 0
    sets: int = 0
    deletes: int = 0
    evictions: int = 0
    expired_removals: int = 0
    current_size: int = 0
    total_size_bytes: int = 0
    avg_access_time: float = 0.0
    
    @property
    def hit_rate(self) -> float:
        """Taxa de acerto do cache."""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0
    
    @property
    def memory_efficiency(self) -> float:
        """Eficiência de memória (%)."""
        if self.total_size_bytes == 0:
            return 100.0
        compressed_entries = self.sets - self.current_size  # Estimativa
        return (compressed_entries / max(self.sets, 1)) * 100


class AsyncInMemoryCache:
    """
    Implementação enterprise de cache assíncrono em memória.
    
    Características:
    - TTL configurável por entrada
    - Múltiplas políticas de eviction (FIFO, LRU, LFU)
    - Compressão automática para valores grandes
    - Métricas detalhadas
    - Cleanup automático de entradas expiradas
    - Thread-safe com asyncio
    - Namespaces para organização
    """

    def __init__(
        self,
        ttl_sec: int = None,
        max_size: int = None,
        eviction_policy: EvictionPolicy = EvictionPolicy.LRU,
        enable_compression: bool = None,
        compression_threshold: int = 1024,  # Comprimir se > 1KB
        cleanup_interval: float = None
    ):
        """
        Inicializa o cache avançado.

        Args:
            ttl_sec: Tempo de vida padrão (usa config se None)
            max_size: Tamanho máximo (usa config se None)
            eviction_policy: Política de eviction
            enable_compression: Habilitar compressão (usa config se None)
            compression_threshold: Tamanho mínimo para compressão
            cleanup_interval: Intervalo de cleanup automático
        """
        # Configurações
        self._ttl = ttl_sec or settings.cache.cache_ttl_sec
        self._max_size = max_size or settings.cache.cache_max_size
        self._eviction_policy = eviction_policy
        self._enable_compression = (
            enable_compression 
            if enable_compression is not None 
            else settings.cache.cache_compression
        )
        self._compression_threshold = compression_threshold
        self._cleanup_interval = cleanup_interval or settings.cache.cleanup_interval_sec
        
        # Estruturas de dados
        self._cache: Dict[str, CacheEntry] = {}
        self._stats = CacheStats()
        self._lock = asyncio.Lock()
        
        # Estruturas para políticas de eviction
        if eviction_policy == EvictionPolicy.FIFO:
            self._order_tracker: deque = deque()
        elif eviction_policy == EvictionPolicy.LRU:
            self._order_tracker: OrderedDict = OrderedDict()
        elif eviction_policy == EvictionPolicy.LFU:
            self._frequency_tracker: Dict[str, int] = {}
        
        # Task de cleanup automático
        self._cleanup_task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()
        
        logger.info(
            f"Cache inicializado: TTL={self._ttl}s, "
            f"max_size={self._max_size}, "
            f"policy={eviction_policy.value}, "
            f"compression={self._enable_compression}"
        )

    async def start_background_cleanup(self):
        """Inicia task de cleanup em background."""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._background_cleanup())
            logger.info("Background cleanup iniciado")

    async def stop_background_cleanup(self):
        """Para task de cleanup em background."""
        if self._cleanup_task:
            self._shutdown_event.set()
            try:
                await asyncio.wait_for(self._cleanup_task, timeout=5.0)
            except asyncio.TimeoutError:
                self._cleanup_task.cancel()
            self._cleanup_task = None
            logger.info("Background cleanup parado")

    async def _background_cleanup(self):
        """Loop de cleanup executado em background."""
        while not self._shutdown_event.is_set():
            try:
                await self.cleanup_expired()
                await asyncio.wait_for(
                    self._shutdown_event.wait(), 
                    timeout=self._cleanup_interval
                )
            except asyncio.TimeoutError:
                continue  # Timeout normal, continuar
            except Exception as e:
                logger.error(f"Erro no background cleanup: {e}")
                await asyncio.sleep(60)  # Wait before retry

    async def get(self, key: str, default: Any = None) -> Any:
        """
        Obtém um valor do cache.
        
        Args:
            key: Chave do cache
            default: Valor padrão se não encontrado
            
        Returns:
            Valor armazenado ou default
        """
        start_time = time.time()
        
        async with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                self._stats.misses += 1
                logger.debug(f"Cache MISS: '{key}'")
                return default
            
            # Verificar expiração
            if time.monotonic() >= entry.expiration_time:
                self._stats.expired_removals += 1
                self._remove_entry(key)
                logger.debug(f"Cache EXPIRED: '{key}'")
                return default
            
            # Atualizar estatísticas de acesso
            self._stats.hits += 1
            entry.last_accessed = time.time()
            entry.access_count += 1
            
            # Atualizar ordem para LRU
            if self._eviction_policy == EvictionPolicy.LRU:
                self._order_tracker.move_to_end(key)
            
            # Descomprimir se necessário
            value = self._decompress_value(entry)
            
            # Atualizar tempo médio de acesso
            access_time = time.time() - start_time
            self._update_avg_access_time(access_time)
            
            logger.debug(f"Cache HIT: '{key}' (access_time: {access_time:.4f}s)")
            return value

    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None,
        namespace: Optional[str] = None
    ) -> bool:
        """
        Define um valor no cache.
        
        Args:
            key: Chave do cache
            value: Valor a armazenar
            ttl: TTL específico (usa padrão se None)
            namespace: Namespace opcional
            
        Returns:
            True se armazenado com sucesso
        """
        try:
            # Preparar chave com namespace
            cache_key = f"{namespace}:{key}" if namespace else key
            
            # Calcular TTL
            effective_ttl = ttl if ttl is not None else self._ttl
            expiration_time = time.monotonic() + effective_ttl
            
            # Comprimir valor se necessário
            compressed_value, is_compressed, size_bytes = self._compress_value(value)
            
            async with self._lock:
                # Remover entrada existente se presente
                if cache_key in self._cache:
                    self._remove_entry(cache_key)
                
                # Verificar limite de tamanho e fazer eviction se necessário
                while len(self._cache) >= self._max_size:
                    evicted = self._evict_one()
                    if not evicted:
                        logger.warning("Não foi possível fazer eviction, cache pode estar cheio")
                        return False
                
                # Criar nova entrada
                entry = CacheEntry(
                    value=compressed_value,
                    expiration_time=expiration_time,
                    created_at=time.time(),
                    last_accessed=time.time(),
                    access_count=0,
                    size_bytes=size_bytes,
                    compressed=is_compressed
                )
                
                # Armazenar
                self._cache[cache_key] = entry
                self._stats.sets += 1
                self._stats.current_size = len(self._cache)
                self._stats.total_size_bytes += size_bytes
                
                # Atualizar estruturas de tracking
                self._update_tracking_structures(cache_key)
                
                logger.debug(
                    f"Cache SET: '{cache_key}' "
                    f"(size: {size_bytes}B, compressed: {is_compressed}, ttl: {effective_ttl}s)"
                )
                
                return True
                
        except Exception as e:
            logger.error(f"Erro ao definir cache para '{key}': {e}")
            return False

    async def delete(self, key: str, namespace: Optional[str] = None) -> bool:
        """
        Remove uma chave do cache.
        
        Args:
            key: Chave a remover
            namespace: Namespace opcional
            
        Returns:
            True se a chave existia e foi removida
        """
        cache_key = f"{namespace}:{key}" if namespace else key
        
        async with self._lock:
            if cache_key in self._cache:
                self._remove_entry(cache_key)
                self._stats.deletes += 1
                logger.debug(f"Cache DELETE: '{cache_key}'")
                return True
            return False

    async def clear(self, namespace: Optional[str] = None):
        """
        Limpa cache (totalmente ou por namespace).
        
        Args:
            namespace: Se especificado, limpa apenas este namespace
        """
        async with self._lock:
            if namespace:
                # Limpar apenas namespace específico
                keys_to_remove = [
                    k for k in self._cache.keys() 
                    if k.startswith(f"{namespace}:")
                ]
                for key in keys_to_remove:
                    self._remove_entry(key)
                logger.info(f"Cache namespace '{namespace}' limpo ({len(keys_to_remove)} itens)")
            else:
                # Limpar tudo
                count = len(self._cache)
                self._cache.clear()
                self._stats.current_size = 0
                self._stats.total_size_bytes = 0
                self._clear_tracking_structures()
                logger.info(f"Cache completamente limpo ({count} itens)")

    async def size(self, namespace: Optional[str] = None) -> int:
        """
        Retorna número de itens no cache.
        
        Args:
            namespace: Se especificado, conta apenas este namespace
            
        Returns:
            Número de itens
        """
        async with self._lock:
            if namespace:
                return sum(
                    1 for k in self._cache.keys() 
                    if k.startswith(f"{namespace}:")
                )
            return len(self._cache)

    async def keys(self, pattern: Optional[str] = None, namespace: Optional[str] = None) -> List[str]:
        """
        Lista chaves no cache.
        
        Args:
            pattern: Padrão de filtro (substring)
            namespace: Namespace a filtrar
            
        Returns:
            Lista de chaves
        """
        async with self._lock:
            keys = list(self._cache.keys())
            
            # Filtrar por namespace
            if namespace:
                keys = [k for k in keys if k.startswith(f"{namespace}:")]
            
            # Filtrar por padrão
            if pattern:
                keys = [k for k in keys if pattern in k]
            
            return keys

    async def cleanup_expired(self) -> int:
        """
        Remove proativamente itens expirados.
        
        Returns:
            Número de itens removidos
        """
        now = time.monotonic()
        removed_count = 0
        
        async with self._lock:
            expired_keys = [
                k for k, v in self._cache.items() 
                if now >= v.expiration_time
            ]
            
            for key in expired_keys:
                self._remove_entry(key)
                removed_count += 1
            
            self._stats.expired_removals += removed_count
        
        if removed_count > 0:
            logger.info(f"Cleanup: {removed_count} itens expirados removidos")
        
        return removed_count

    async def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas detalhadas do cache."""
        async with self._lock:
            return {
                "hits": self._stats.hits,
                "misses": self._stats.misses,
                "hit_rate": self._stats.hit_rate,
                "sets": self._stats.sets,
                "deletes": self._stats.deletes,
                "evictions": self._stats.evictions,
                "expired_removals": self._stats.expired_removals,
                "current_size": self._stats.current_size,
                "max_size": self._max_size,
                "total_size_bytes": self._stats.total_size_bytes,
                "avg_access_time": self._stats.avg_access_time,
                "memory_efficiency": self._stats.memory_efficiency,
                "eviction_policy": self._eviction_policy.value,
                "ttl_seconds": self._ttl,
                "compression_enabled": self._enable_compression,
                "uptime": time.time() - (time.time() - self._stats.hits - self._stats.misses)
            }

    def _compress_value(self, value: Any) -> tuple[Any, bool, int]:
        """
        Comprime valor se necessário.
        
        Returns:
            (valor_final, foi_comprimido, tamanho_bytes)
        """
        # Serializar valor
        try:
            serialized = pickle.dumps(value)
            size_bytes = len(serialized)
            
            # Comprimir se habilitado e valor for grande
            if (self._enable_compression and 
                size_bytes > self._compression_threshold):
                
                compressed = gzip.compress(serialized)
                compressed_size = len(compressed)
                
                # Usar compressão apenas se houver benefício
                if compressed_size < size_bytes * 0.8:  # 20% de economia mínima
                    return compressed, True, compressed_size
            
            return serialized, False, size_bytes
            
        except Exception as e:
            logger.error(f"Erro na compressão: {e}")
            return value, False, len(str(value).encode())

    def _decompress_value(self, entry: CacheEntry) -> Any:
        """Descomprime valor se necessário."""
        try:
            if entry.compressed:
                decompressed = gzip.decompress(entry.value)
                return pickle.loads(decompressed)
            else:
                return pickle.loads(entry.value)
        except Exception as e:
            logger.error(f"Erro na descompressão: {e}")
            return entry.value

    def _evict_one(self) -> bool:
        """
        Remove uma entrada baseado na política de eviction.
        
        Returns:
            True se conseguiu remover uma entrada
        """
        if not self._cache:
            return False
        
        try:
            if self._eviction_policy == EvictionPolicy.FIFO:
                if self._order_tracker:
                    key_to_evict = self._order_tracker.popleft()
                else:
                    key_to_evict = next(iter(self._cache))
            
            elif self._eviction_policy == EvictionPolicy.LRU:
                if self._order_tracker:
                    key_to_evict = next(iter(self._order_tracker))
                    self._order_tracker.popitem(last=False)
                else:
                    key_to_evict = next(iter(self._cache))
            
            elif self._eviction_policy == EvictionPolicy.LFU:
                # Encontrar chave com menor frequência
                if self._frequency_tracker:
                    key_to_evict = min(
                        self._frequency_tracker.keys(),
                        key=lambda k: self._frequency_tracker[k]
                    )
                else:
                    key_to_evict = next(iter(self._cache))
            
            else:
                # Fallback: remover primeiro item
                key_to_evict = next(iter(self._cache))
            
            self._remove_entry(key_to_evict)
            self._stats.evictions += 1
            
            logger.debug(f"Cache EVICTION ({self._eviction_policy.value}): '{key_to_evict}'")
            return True
            
        except Exception as e:
            logger.error(f"Erro na eviction: {e}")
            return False

    def _remove_entry(self, key: str):
        """Remove entrada do cache e estruturas de tracking."""
        if key in self._cache:
            entry = self._cache[key]
            self._stats.total_size_bytes -= entry.size_bytes
            del self._cache[key]
            self._stats.current_size = len(self._cache)
        
        # Remover das estruturas de tracking
        if self._eviction_policy == EvictionPolicy.FIFO:
            try:
                self._order_tracker.remove(key)
            except ValueError:
                pass
        elif self._eviction_policy == EvictionPolicy.LRU:
            self._order_tracker.pop(key, None)
        elif self._eviction_policy == EvictionPolicy.LFU:
            self._frequency_tracker.pop(key, None)

    def _update_tracking_structures(self, key: str):
        """Atualiza estruturas de tracking para eviction."""
        if self._eviction_policy == EvictionPolicy.FIFO:
            self._order_tracker.append(key)
        elif self._eviction_policy == EvictionPolicy.LRU:
            self._order_tracker[key] = None  # OrderedDict mantém ordem
        elif self._eviction_policy == EvictionPolicy.LFU:
            self._frequency_tracker[key] = 0

    def _clear_tracking_structures(self):
        """Limpa todas as estruturas de tracking."""
        if self._eviction_policy == EvictionPolicy.FIFO:
            self._order_tracker.clear()
        elif self._eviction_policy == EvictionPolicy.LRU:
            self._order_tracker.clear()
        elif self._eviction_policy == EvictionPolicy.LFU:
            self._frequency_tracker.clear()

    def _update_avg_access_time(self, access_time: float):
        """Atualiza tempo médio de acesso."""
        total_accesses = self._stats.hits + self._stats.misses
        if total_accesses > 0:
            current_avg = self._stats.avg_access_time
            new_avg = ((current_avg * (total_accesses - 1)) + access_time) / total_accesses
            self._stats.avg_access_time = new_avg

    async def __aenter__(self):
        """Context manager entry."""
        await self.start_background_cleanup()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        await self.stop_background_cleanup()


# Instância global de cache
global_cache = AsyncInMemoryCache()


# Decorator para cache de função
def cache_result(
    ttl: Optional[int] = None,
    key_prefix: str = "",
    namespace: str = "functions",
    include_args: bool = True
):
    """
    Decorator para cachear resultados de funções assíncronas.
    
    Args:
        ttl: TTL específico
        key_prefix: Prefixo da chave
        namespace: Namespace do cache
        include_args: Incluir argumentos na chave
    """
    def decorator(func: Callable):
        async def wrapper(*args, **kwargs):
            # Gerar chave do cache
            if include_args:
                key_parts = [func.__name__]
                if args:
                    key_parts.extend(str(arg) for arg in args)
                if kwargs:
                    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = hashlib.md5("|".join(key_parts).encode()).hexdigest()
            else:
                cache_key = func.__name__
            
            if key_prefix:
                cache_key = f"{key_prefix}:{cache_key}"
            
            # Tentar obter do cache
            result = await global_cache.get(cache_key, namespace=namespace)
            
            if result is not None:
                logger.debug(f"Cache hit para função {func.__name__}")
                return result
            
            # Executar função e cachear resultado
            result = await func(*args, **kwargs)
            await global_cache.set(cache_key, result, ttl=ttl, namespace=namespace)
            
            logger.debug(f"Resultado da função {func.__name__} cacheado")
            return result
        
        return wrapper
    return decorator
