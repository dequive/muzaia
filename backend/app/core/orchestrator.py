# backend/app/core/llm_orchestrator.py
# -*- coding: utf-8 -*-
"""
Módulo do Orquestrador de LLMs, agora utilizando a LLMFactory.

Delega a criação de instâncias de LLM para a fábrica e gere o ciclo de
vida de cada instância durante o processamento de uma requisição.
"""

import asyncio
import hashlib
import time
import logging
import aiohttp
from typing import Dict, List, Optional

from app.core.config import settings
from app.schemas import OrchestratorResponse, ContextType, GenerationParams
from app.core.exceptions import *
from app.core.factory import LLMFactory
from app.core.resilience import CircuitBreaker, RateLimiter
from app.core.consensus import ConsensusEngine
from app.core.cache import AsyncInMemoryCache

log = logging.getLogger(__name__)

class LLMOrchestrator:
    """
    Orquestrador avançado que utiliza uma fábrica para criar dinamicamente clientes LLM.
    """
    def __init__(self, session: aiohttp.ClientSession):
        self._session = session
        self._factory = LLMFactory(session)
        self._context_router: Dict[str, List[str]] = {}
        
        self._circuit_breaker = CircuitBreaker(settings.resilience.circuit_breaker_threshold, settings.resilience.circuit_breaker_reset_sec)
        self._rate_limiter = RateLimiter(settings.resilience.rate_limit_max_calls, settings.resilience.rate_limit_period_sec)
        self._consensus_engine = ConsensusEngine()
        self._cache = AsyncInMemoryCache(ttl_sec=settings.cache.cache_ttl_sec, max_size=settings.cache.cache_max_size)
        
        log.info("LLMOrchestrator instanciado. A aguardar inicialização.")

    async def initialize(self):
        """Inicializa os componentes do orquestrador."""
        self._init_context_router()
        log.info(f"LLMOrchestrator inicializado. Modelos disponíveis via fábrica: {self._factory.get_available_models()}")

    def _init_context_router(self):
        """Define as regras de roteamento de modelos por contexto."""
        # Agora podemos usar os modelos configurados na fábrica
        self._context_router = {
            ContextType.GENERAL.value: [settings.models.ollama_llama_model, settings.models.openrouter_qwen_model],
            ContextType.LEGAL_RESEARCH.value: [settings.models.openrouter_qwen_model, settings.models.ollama_llama_model], # Exemplo
            ContextType.DOCUMENT_ANALYSIS.value: [settings.models.ollama_gemma_model], # Exemplo
        }

    def _generate_cache_key(self, query: str, context: str, params: GenerationParams) -> str:
        """Gera uma chave de cache única."""
        params_json = params.model_dump_json(sort_keys=True)
        return hashlib.sha256(f"{query.strip()}:{context}:{params_json}".encode()).hexdigest()

    async def _query_single_model_with_retry(self, model_name: str, prompt: str, context: str, params: GenerationParams) -> Optional[LLMResponse]:
        """Consulta um único modelo, criando-o via fábrica e aplicando resiliência."""
        if await self._circuit_breaker.is_open(model_name):
            log.warning(f"Consulta ao modelo '{model_name}' pulada, Circuit Breaker está aberto.")
            return None

        last_exception = None
        for attempt in range(settings.orchestrator.default_model_retries + 1):
            try:
                # Cria a instância do LLM dinamicamente usando a fábrica
                # e gere o seu ciclo de vida com 'async with'.
                async with await self._factory.create_llm(model_name) as model:
                    response = await model.generate(prompt=prompt, context=context, params=params)
                
                await self._circuit_breaker.record_success(model_name)
                return response
            except LLMError as e: # Captura exceções específicas do LLM
                last_exception = e
                log.warning(f"Tentativa {attempt + 1} falhou para o modelo '{model_name}' (LLMError): {e}")
            except Exception as e:
                last_exception = e
                log.warning(f"Tentativa {attempt + 1} falhou para o modelo '{model_name}' (Erro genérico): {e}")

            if attempt < settings.orchestrator.default_model_retries:
                await asyncio.sleep(1.5 ** attempt)

        await self._circuit_breaker.record_failure(model_name)
        log.error(f"Todas as {settings.orchestrator.default_model_retries + 1} tentativas falharam para '{model_name}'. Último erro: {last_exception}")
        return None

    async def generate(self, query: str, context: str, user_id: str, params: Optional[GenerationParams] = None, min_confidence: float = 0.70) -> OrchestratorResponse:
        """Ponto de entrada principal para processar uma consulta."""
        start_time = time.monotonic()
        active_params = params or GenerationParams()

        try:
            # ... (Lógica de validação, rate limiting e cache permanece a mesma) ...
            if not query or len(query) > settings.orchestrator.max_query_length:
                raise InvalidInputError("Query inválida ou excede o comprimento máximo.")
            await self._rate_limiter.check_limit(user_id)
            cache_key = self._generate_cache_key(query, context, active_params)
            # ...

            model_names = self._context_router.get(context, [settings.models.ollama_llama_model])
            
            tasks = [self._query_single_model_with_retry(name, query, context, active_params) for name in model_names]
            responses = [r for r in await asyncio.gather(*tasks) if r is not None]

            if not responses:
                raise LLMServiceError("Nenhum modelo conseguiu gerar uma resposta válida.")
            
            # ... (Lógica de consenso e retorno permanece a mesma) ...
            consensus = self._consensus_engine.get_consensus(responses)
            # ...
            return OrchestratorResponse(...)

        except Exception as e:
            # ... (Lógica de tratamento de erro permanece a mesma) ...
            return OrchestratorResponse(...)
