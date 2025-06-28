# backend/app/core/resilience.py

import asyncio
import time
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple, List, Optional

from app.core.exceptions import RateLimitError

log = logging.getLogger(__name__)

class CircuitBreaker:
    """
    Implementação assíncrona do padrão Circuit Breaker.
    Previne chamadas a serviços que estão a falhar repetidamente.
    """
    def __init__(self, threshold: int, reset_sec: int):
        self._threshold = threshold
        self._reset_timeout = timedelta(seconds=reset_sec)
        self._state: Dict[str, Tuple[int, Optional[datetime]]] = {}  # {resource: (failures, open_until)}
        self._lock = asyncio.Lock()

    async def is_open(self, resource: str) -> bool:
        """Verifica se o circuito para um recurso específico está aberto."""
        async with self._lock:
            failures, open_until = self._state.get(resource, (0, None))
            if open_until and datetime.now(timezone.utc) < open_until:
                log.warning(f"Circuito para '{resource}' está ABERTO.")
                return True
            return False

    async def record_failure(self, resource: str):
        """Regista uma falha para um recurso."""
        async with self._lock:
            failures, open_until = self._state.get(resource, (0, None))
            new_failures = failures + 1
            
            if new_failures >= self._threshold:
                open_until = datetime.now(timezone.utc) + self._reset_timeout
                log.error(f"Circuit Breaker para '{resource}' aberto por {self._reset_timeout.total_seconds()}s após {new_failures} falhas.")
            
            self._state[resource] = (new_failures, open_until)

    async def record_success(self, resource: str):
        """Regista um sucesso e reseta o estado do circuito para um recurso."""
        async with self._lock:
            if resource in self._state:
                log.info(f"Circuit Breaker para '{resource}' foi fechado devido a sucesso.")
                self._state.pop(resource)

class RateLimiter:
    """
    Controla a taxa de requisições por chave (ex: user_id) usando uma janela deslizante.
    """
    def __init__(self, max_calls: int, period_sec: int):
        self._max_calls = max_calls
        self._period = period_sec
        self._calls: Dict[str, List[float]] = {}
        self._lock = asyncio.Lock()

    async def check_limit(self, key: str):
        """
        Verifica se a requisição é permitida. Levanta RateLimitError se o limite for excedido.
        """
        async with self._lock:
            now = time.monotonic()
            calls = self._calls.get(key, [])
            
            # Filtra chamadas que já expiraram da janela de tempo
            valid_calls = [c for c in calls if now - c < self._period]
            
            if len(valid_calls) >= self._max_calls:
                log.warning(f"Rate limit excedido para a chave '{key}'.")
                raise RateLimitError(f"Limite de {self._max_calls} requisições por {self._period}s excedido.")
            
            valid_calls.append(now)
            self._calls[key] = valid_calls
