# -*- coding: utf-8 -*-
"""
Módulo de Cache Assíncrono em Memória.

Fornece uma implementação de cache segura para ambientes concorrentes,
com TTL (Time-To-Live) e limite de tamanho (max_size).
"""
import asyncio
import time
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from collections import deque

from app.core.config import settings # Importar configurações centralizadas

log = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Estrutura de dados para uma entrada no cache, melhorando a legibilidade."""
    value: Any
    expiration_time: float

class AsyncInMemoryCache:
    """
    Implementação de um cache assíncrono em memória com TTL, limite de tamanho e política de evicção FIFO.
    """
    def __init__(self, ttl_sec: int = settings.cache.cache_ttl_sec, max_size: int = settings.cache.cache_max_size):
        """
        Inicializa o cache.

        Args:
            ttl_sec: Tempo de vida padrão para os itens do cache (em segundos).
            max_size: Número máximo de itens que o cache pode conter.
        """
        self._cache: Dict[str, CacheEntry] = {}
        self._keys_fifo: deque[str] = deque() # Fila para manter a ordem de inserção (FIFO)
        self._ttl = ttl_sec
        self._max_size = max_size
        self._lock = asyncio.Lock()
        log.info(f"Cache em memória inicializado com TTL de {ttl_sec}s e tamanho máximo de {max_size} itens.")

    async def get(self, key: str) -> Optional[Any]:
        """Obtém um valor do cache, se existir e não estiver expirado."""
        async with self._lock:
            entry = self._cache.get(key)
            if entry:
                if time.monotonic() < entry.expiration_time:
                    log.debug(f"Cache HIT para a chave: '{key}'")
                    return entry.value
                
                # Se expirou, remove-o
                log.debug(f"Cache EXPIRED para a chave: '{key}'")
                self._remove_entry(key)
        
        log.debug(f"Cache MISS para a chave: '{key}'")
        return None

    async def set(self, key: str, value: Any):
        """Define um valor no cache, aplicando TTL e política de evicção se necessário."""
        async with self._lock:
            # Se a chave já existe, remove a entrada antiga para atualizar a sua posição na fila FIFO
            if key in self._cache:
                self._remove_entry(key)
            
            # Verifica se o cache está cheio e remove o item mais antigo (FIFO)
            if len(self._cache) >= self._max_size:
                oldest_key = self._keys_fifo.popleft()
                self._remove_entry(oldest_key)
                log.info(f"Cache cheio. Item mais antigo '{oldest_key}' removido (evicção).")

            # Adiciona a nova entrada
            expiration_time = time.monotonic() + self._ttl
            self._cache[key] = CacheEntry(value=value, expiration_time=expiration_time)
            self._keys_fifo.append(key)
            log.debug(f"Cache SET para a chave: '{key}'")

    async def delete(self, key: str) -> bool:
        """Remove uma chave específica do cache. Retorna True se a chave existia."""
        async with self._lock:
            if key in self._cache:
                self._remove_entry(key)
                log.debug(f"Cache DELETE para a chave: '{key}'")
                return True
        return False

    async def clear(self):
        """Limpa todo o cache."""
        async with self._lock:
            self._cache.clear()
            self._keys_fifo.clear()
            log.info("Cache foi completamente limpo.")

    async def size(self) -> int:
        """Retorna o número atual de itens no cache."""
        async with self._lock:
            return len(self._cache)

    async def cleanup_expired(self) -> int:
        """
        Percorre o cache e remove proativamente todos os itens expirados.
        Retorna o número de itens removidos.
        """
        now = time.monotonic()
        removed_count = 0
        async with self._lock:
            # É seguro iterar sobre uma cópia das chaves para modificar o dicionário
            expired_keys = [k for k, v in self._cache.items() if now >= v.expiration_time]
            for key in expired_keys:
                self._remove_entry(key)
                removed_count += 1
        
        if removed_count > 0:
            log.info(f"{removed_count} itens expirados foram removidos na limpeza.")
        return removed_count

    def _remove_entry(self, key: str):
        """
        Método auxiliar interno para remover uma entrada do cache e da fila.
        ATENÇÃO: Este método não é thread-safe e deve ser chamado dentro de um lock.
        """
        if key in self._cache:
            del self._cache[key]
            # A remoção de uma deque pode ser O(n), mas é aceitável para um cache deste tamanho
            try:
                self._keys_fifo.remove(key)
            except ValueError:
                # Pode acontecer se a chave já foi removida da fila por outro processo
                pass
