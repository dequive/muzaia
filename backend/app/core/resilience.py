# -*- coding: utf-8 -*-
"""
Módulo de Resiliência para Mozaia LLM Orchestrator.

Implementa padrões de resiliência essenciais para sistemas distribuídos:
- Circuit Breaker: Previne cascata de falhas
- Rate Limiter: Controla taxa de requisições
- Retry com backoff: Retentativos inteligentes
- Health Monitor: Monitoramento contínuo de saúde
"""
import asyncio
import time
import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple, List, Optional, Callable, Any
from enum import Enum
from dataclasses import dataclass, field
from contextlib import asynccontextmanager

from app.core.exceptions import RateLimitError, LLMServiceError, LLMConnectionError

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Estados do Circuit Breaker."""
    CLOSED = "closed"      # Funcionando normalmente
    OPEN = "open"          # Falhas detectadas, bloqueando requisições
    HALF_OPEN = "half_open"  # Testando se serviço voltou


@dataclass
class CircuitBreakerConfig:
    """Configuração do Circuit Breaker."""
    failure_threshold: int = 5  # Número de falhas para abrir circuito
    reset_timeout_sec: int = 60  # Tempo antes de tentar half-open
    half_open_max_calls: int = 3  # Máximo de chamadas em half-open
    success_threshold: int = 2  # Sucessos necessários para fechar circuito
    monitor_window_sec: int = 300  # Janela para contar falhas


@dataclass
class CircuitBreakerMetrics:
    """Métricas do Circuit Breaker."""
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[datetime] = None
    last_success_time: Optional[datetime] = None
    state_changed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    total_requests: int = 0
    blocked_requests: int = 0
    half_open_attempts: int = 0


class CircuitBreaker:
    """
    Implementação robusta do padrão Circuit Breaker.
    
    Características:
    - Estados CLOSED/OPEN/HALF_OPEN
    - Janela deslizante para contagem de falhas
    - Métricas detalhadas
    - Thread-safe com asyncio
    - Configuração flexível
    """

    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.metrics = CircuitBreakerMetrics()
        self._lock = asyncio.Lock()
        self._failure_timestamps: List[float] = []
        
        logger.info(f"Circuit Breaker '{name}' inicializado com threshold={self.config.failure_threshold}")

    async def is_call_allowed(self) -> bool:
        """
        Verifica se uma chamada é permitida baseada no estado atual.
        
        Returns:
            True se a chamada for permitida
        """
        async with self._lock:
            self.metrics.total_requests += 1
            current_time = datetime.now(timezone.utc)
            
            if self.metrics.state == CircuitState.CLOSED:
                return True
            
            elif self.metrics.state == CircuitState.OPEN:
                # Verificar se é hora de tentar half-open
                if self._should_attempt_reset(current_time):
                    logger.info(f"Circuit Breaker '{self.name}' mudando para HALF_OPEN")
                    self._transition_to_half_open(current_time)
                    return True
                else:
                    self.metrics.blocked_requests += 1
                    logger.debug(f"Circuit Breaker '{self.name}' bloqueou requisição (OPEN)")
                    return False
            
            elif self.metrics.state == CircuitState.HALF_OPEN:
                # Permitir apenas um número limitado de tentativas
                if self.metrics.half_open_attempts < self.config.half_open_max_calls:
                    self.metrics.half_open_attempts += 1
                    return True
                else:
                    self.metrics.blocked_requests += 1
                    logger.debug(f"Circuit Breaker '{self.name}' bloqueou requisição (HALF_OPEN limit)")
                    return False
        
        return False

    async def record_success(self):
        """Registra uma operação bem-sucedida."""
        async with self._lock:
            current_time = datetime.now(timezone.utc)
            self.metrics.success_count += 1
            self.metrics.last_success_time = current_time
            
            if self.metrics.state == CircuitState.HALF_OPEN:
                # Verificar se devemos fechar o circuito
                if self.metrics.success_count >= self.config.success_threshold:
                    logger.info(f"Circuit Breaker '{self.name}' fechado após {self.metrics.success_count} sucessos")
                    self._transition_to_closed(current_time)
            
            elif self.metrics.state == CircuitState.OPEN:
                # Reset do estado se recebermos sucesso inesperado
                logger.info(f"Circuit Breaker '{self.name}' fechado por sucesso inesperado")
                self._transition_to_closed(current_time)

    async def record_failure(self, error: Optional[Exception] = None):
        """
        Registra uma falha na operação.
        
        Args:
            error: Exceção que causou a falha (opcional)
        """
        async with self._lock:
            current_time = datetime.now(timezone.utc)
            current_timestamp = time.time()
            
            self.metrics.failure_count += 1
            self.metrics.last_failure_time = current_time
            self._failure_timestamps.append(current_timestamp)
            
            # Limpar timestamps antigos
            self._cleanup_old_failures(current_timestamp)
            
            error_msg = f" - {str(error)}" if error else ""
            logger.warning(f"Circuit Breaker '{self.name}' registrou falha{error_msg}")
            
            if self.metrics.state == CircuitState.CLOSED:
                # Verificar se devemos abrir o circuito
                if len(self._failure_timestamps) >= self.config.failure_threshold:
                    logger.error(
                        f"Circuit Breaker '{self.name}' aberto após "
                        f"{len(self._failure_timestamps)} falhas em "
                        f"{self.config.monitor_window_sec}s"
                    )
                    self._transition_to_open(current_time)
            
            elif self.metrics.state == CircuitState.HALF_OPEN:
                # Falha em half-open volta para open
                logger.warning(f"Circuit Breaker '{self.name}' voltou para OPEN devido à falha em HALF_OPEN")
                self._transition_to_open(current_time)

    def _should_attempt_reset(self, current_time: datetime) -> bool:
        """Verifica se deve tentar reset do circuito."""
        if not self.metrics.last_failure_time:
            return True
        
        time_since_failure = current_time - self.metrics.last_failure_time
        return time_since_failure.total_seconds() >= self.config.reset_timeout_sec

    def _transition_to_closed(self, current_time: datetime):
        """Transição para estado CLOSED."""
        self.metrics.state = CircuitState.CLOSED
        self.metrics.state_changed_at = current_time
        self.metrics.failure_count = 0
        self.metrics.success_count = 0
        self.metrics.half_open_attempts = 0
        self._failure_timestamps.clear()

    def _transition_to_open(self, current_time: datetime):
        """Transição para estado OPEN."""
        self.metrics.state = CircuitState.OPEN
        self.metrics.state_changed_at = current_time
        self.metrics.success_count = 0
        self.metrics.half_open_attempts = 0

    def _transition_to_half_open(self, current_time: datetime):
        """Transição para estado HALF_OPEN."""
        self.metrics.state = CircuitState.HALF_OPEN
        self.metrics.state_changed_at = current_time
        self.metrics.success_count = 0
        self.metrics.half_open_attempts = 0

    def _cleanup_old_failures(self, current_timestamp: float):
        """Remove timestamps de falhas antigas da janela."""
        cutoff = current_timestamp - self.config.monitor_window_sec
        self._failure_timestamps = [
            ts for ts in self._failure_timestamps if ts > cutoff
        ]

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas detalhadas do circuit breaker."""
        return {
            "name": self.name,
            "state": self.metrics.state.value,
            "failure_count": self.metrics.failure_count,
            "success_count": self.metrics.success_count,
            "total_requests": self.metrics.total_requests,
            "blocked_requests": self.metrics.blocked_requests,
            "block_rate": (
                self.metrics.blocked_requests / max(self.metrics.total_requests, 1) * 100
            ),
            "last_failure": self.metrics.last_failure_time.isoformat() if self.metrics.last_failure_time else None,
            "last_success": self.metrics.last_success_time.isoformat() if self.metrics.last_success_time else None,
            "state_changed_at": self.metrics.state_changed_at.isoformat(),
            "current_failures_in_window": len(self._failure_timestamps),
            "half_open_attempts": self.metrics.half_open_attempts,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "reset_timeout_sec": self.config.reset_timeout_sec,
                "monitor_window_sec": self.config.monitor_window_sec,
            }
        }


@dataclass 
class RateLimiterConfig:
    """Configuração do Rate Limiter."""
    max_calls: int = 100  # Máximo de chamadas
    period_sec: int = 60  # Período em segundos
    burst_allowance: int = 10  # Rajada permitida
    cleanup_interval_sec: int = 300  # Intervalo de limpeza


class RateLimiter:
    """
    Rate Limiter com janela deslizante e burst allowance.
    
    Características:
    - Janela deslizante para controle preciso
    - Burst allowance para picos de tráfego
    - Cleanup automático de entradas antigas
    - Métricas detalhadas por chave
    - Thread-safe
    """

    def __init__(self, config: Optional[RateLimiterConfig] = None):
        self.config = config or RateLimiterConfig()
        self._calls: Dict[str, List[float]] = {}
        self._metrics: Dict[str, Dict[str, int]] = {}
        self._lock = asyncio.Lock()
        self._last_cleanup = time.time()
        
        logger.info(
            f"Rate Limiter inicializado: {self.config.max_calls} calls/"
            f"{self.config.period_sec}s (burst: {self.config.burst_allowance})"
        )

    async def check_limit(self, key: str, requested_calls: int = 1) -> bool:
        """
        Verifica se a requisição é permitida dentro do limite.
        
        Args:
            key: Identificador único (ex: user_id, ip_address)
            requested_calls: Número de chamadas solicitadas
            
        Returns:
            True se permitido, False se exceder limite
            
        Raises:
            RateLimitError: Se o limite for excedido
        """
        async with self._lock:
            current_time = time.time()
            
            # Cleanup periódico
            await self._cleanup_if_needed(current_time)
            
            # Obter e limpar chamadas antigas
            calls = self._calls.get(key, [])
            valid_calls = [c for c in calls if current_time - c < self.config.period_sec]
            
            # Inicializar métricas se necessário
            if key not in self._metrics:
                self._metrics[key] = {
                    "total_requests": 0,
                    "blocked_requests": 0,
                    "allowed_requests": 0
                }
            
            metrics = self._metrics[key]
            metrics["total_requests"] += requested_calls
            
            # Verificar limite básico
            if len(valid_calls) + requested_calls > self.config.max_calls:
                # Verificar burst allowance
                if len(valid_calls) + requested_calls > self.config.max_calls + self.config.burst_allowance:
                    metrics["blocked_requests"] += requested_calls
                    
                    logger.warning(
                        f"Rate limit excedido para '{key}': "
                        f"{len(valid_calls) + requested_calls} > "
                        f"{self.config.max_calls + self.config.burst_allowance}"
                    )
                    
                    raise RateLimitError(
                        f"Limite de {self.config.max_calls} requisições por "
                        f"{self.config.period_sec}s excedido para '{key}'"
                    )
                else:
                    logger.info(f"Burst allowance usada para '{key}'")
            
            # Permitir requisição
            for _ in range(requested_calls):
                valid_calls.append(current_time)
            
            self._calls[key] = valid_calls
            metrics["allowed_requests"] += requested_calls
            
            return True

    async def get_remaining_calls(self, key: str) -> int:
        """
        Retorna número de chamadas restantes para uma chave.
        
        Args:
            key: Identificador único
            
        Returns:
            Número de chamadas restantes
        """
        async with self._lock:
            current_time = time.time()
            calls = self._calls.get(key, [])
            valid_calls = [c for c in calls if current_time - c < self.config.period_sec]
            
            return max(0, self.config.max_calls - len(valid_calls))

    async def reset_key(self, key: str):
        """
        Reseta contadores para uma chave específica.
        
        Args:
            key: Identificador único
        """
        async with self._lock:
            if key in self._calls:
                del self._calls[key]
            if key in self._metrics:
                del self._metrics[key]
            
            logger.info(f"Rate limit resetado para '{key}'")

    async def _cleanup_if_needed(self, current_time: float):
        """Cleanup periódico de entradas antigas."""
        if current_time - self._last_cleanup > self.config.cleanup_interval_sec:
            await self._cleanup_old_entries(current_time)
            self._last_cleanup = current_time

    async def _cleanup_old_entries(self, current_time: float):
        """Remove entradas antigas dos dicionários."""
        keys_to_remove = []
        
        for key, calls in self._calls.items():
            valid_calls = [c for c in calls if current_time - c < self.config.period_sec]
            
            if not valid_calls:
                keys_to_remove.append(key)
            else:
                self._calls[key] = valid_calls
        
        for key in keys_to_remove:
            del self._calls[key]
            if key in self._metrics:
                del self._metrics[key]
        
        if keys_to_remove:
            logger.debug(f"Rate limiter cleanup: removidas {len(keys_to_remove)} entradas")

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas globais do rate limiter."""
        total_keys = len(self._calls)
        total_requests = sum(m.get("total_requests", 0) for m in self._metrics.values())
        total_blocked = sum(m.get("blocked_requests", 0) for m in self._metrics.values())
        total_allowed = sum(m.get("allowed_requests", 0) for m in self._metrics.values())
        
        return {
            "active_keys": total_keys,
            "total_requests": total_requests,
            "blocked_requests": total_blocked,
            "allowed_requests": total_allowed,
            "block_rate": (total_blocked / max(total_requests, 1)) * 100,
            "config": {
                "max_calls": self.config.max_calls,
                "period_sec": self.config.period_sec,
                "burst_allowance": self.config.burst_allowance,
            }
        }

    def get_key_metrics(self, key: str) -> Optional[Dict[str, Any]]:
        """Retorna métricas para uma chave específica."""
        if key not in self._metrics:
            return None
        
        current_calls = len(self._calls.get(key, []))
        remaining = max(0, self.config.max_calls - current_calls)
        
        return {
            **self._metrics[key],
            "current_calls": current_calls,
            "remaining_calls": remaining,
            "utilization": (current_calls / self.config.max_calls) * 100
        }


class RetryConfig:
    """Configuração para retry com backoff."""
    
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0,
        jitter: bool = True
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.backoff_factor = backoff_factor
        self.jitter = jitter


async def retry_with_backoff(
    func: Callable,
    config: Optional[RetryConfig] = None,
    exceptions: Tuple = (Exception,),
    on_retry: Optional[Callable] = None
) -> Any:
    """
    Executa função com retry e backoff exponencial.
    
    Args:
        func: Função a ser executada
        config: Configuração de retry
        exceptions: Tupla de exceções para retry
        on_retry: Callback chamado em cada retry
        
    Returns:
        Resultado da função
        
    Raises:
        A última exceção se todas as tentativas falharem
    """
    config = config or RetryConfig()
    last_exception = None
    
    for attempt in range(config.max_attempts):
        try:
            if asyncio.iscoroutinefunction(func):
                return await func()
            else:
                return func()
                
        except exceptions as e:
            last_exception = e
            
            if attempt == config.max_attempts - 1:
                logger.error(f"Todas as {config.max_attempts} tentativas falharam: {e}")
                raise
            
            # Calcular delay
            delay = min(
                config.base_delay * (config.backoff_factor ** attempt),
                config.max_delay
            )
            
            # Adicionar jitter
            if config.jitter:
                delay *= (0.5 + random.random() * 0.5)
            
            logger.warning(f"Tentativa {attempt + 1} falhou: {e}. Tentando novamente em {delay:.2f}s")
            
            if on_retry:
                try:
                    if asyncio.iscoroutinefunction(on_retry):
                        await on_retry(attempt, e, delay)
                    else:
                        on_retry(attempt, e, delay)
                except Exception as callback_error:
                    logger.error(f"Erro no callback de retry: {callback_error}")
            
            await asyncio.sleep(delay)
    
    raise last_exception


class ResilienceManager:
    """
    Gerenciador central de resiliência.
    
    Combina Circuit Breaker, Rate Limiter e Retry
    em uma interface unificada.
    """
    
    def __init__(self):
        self._circuit_breakers: Dict[str, CircuitBreaker] = {}
        self._rate_limiters: Dict[str, RateLimiter] = {}
        self._lock = asyncio.Lock()
        
        logger.info("Resilience Manager inicializado")

    async def get_circuit_breaker(
        self,
        name: str,
        config: Optional[CircuitBreakerConfig] = None
    ) -> CircuitBreaker:
        """Obtém ou cria circuit breaker."""
        async with self._lock:
            if name not in self._circuit_breakers:
                self._circuit_breakers[name] = CircuitBreaker(name, config)
            return self._circuit_breakers[name]

    async def get_rate_limiter(
        self,
        name: str,
        config: Optional[RateLimiterConfig] = None
    ) -> RateLimiter:
        """Obtém ou cria rate limiter."""
        async with self._lock:
            if name not in self._rate_limiters:
                self._rate_limiters[name] = RateLimiter(config)
            return self._rate_limiters[name]

    @asynccontextmanager
    async def protected_call(
        self,
        resource_name: str,
        user_key: Optional[str] = None,
        circuit_config: Optional[CircuitBreakerConfig] = None,
        rate_config: Optional[RateLimiterConfig] = None
    ):
        """
        Context manager para chamadas protegidas com circuit breaker e rate limiter.
        
        Args:
            resource_name: Nome do recurso/serviço
            user_key: Chave para rate limiting (opcional)
            circuit_config: Configuração do circuit breaker
            rate_config: Configuração do rate limiter
        """
        # Circuit breaker check
        circuit_breaker = await self.get_circuit_breaker(resource_name, circuit_config)
        
        if not await circuit_breaker.is_call_allowed():
            raise LLMServiceError(f"Circuit breaker aberto para '{resource_name}'")
        
        # Rate limiting check
        if user_key:
            rate_limiter = await self.get_rate_limiter(f"{resource_name}_rate", rate_config)
            await rate_limiter.check_limit(user_key)
        
        try:
            yield
            await circuit_breaker.record_success()
            
        except Exception as e:
            await circuit_breaker.record_failure(e)
            raise

    def get_all_metrics(self) -> Dict[str, Any]:
        """Retorna métricas de todos os componentes."""
        return {
            "circuit_breakers": {
                name: cb.get_metrics() 
                for name, cb in self._circuit_breakers.items()
            },
            "rate_limiters": {
                name: rl.get_metrics() 
                for name, rl in self._rate_limiters.items()
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Instância global do gerenciador de resiliência
resilience_manager = ResilienceManager()
