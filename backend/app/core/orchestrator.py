# backend/app/core/llm_orchestrator.py
# -*- coding: utf-8 -*-
"""
Módulo do Orquestrador de LLMs.

Componente central que gere o ciclo de vida de uma requisição,
incluindo roteamento, resiliência, cache e consenso.
"""

import asyncio
import hashlib
import time
import logging
import aiohttp
from typing import Dict, List, Optional

from app.core.config import settings
from app.schemas import (
    LLMResponse, OrchestratorResponse, ContextType,
    GenerationParams, PromptTemplate
)
from app.core.exceptions import *
from app.core.protocols import AbstractLLM
from app.core.resilience import CircuitBreaker, RateLimiter
from app.core.consensus import ConsensusEngine
from app.core.cache import AsyncInMemoryCache
from app.models.api_llm import OpenRouterLLM, CohereLLM
from app.models.local_llm import OllamaLLM

log = logging.getLogger(__name__)

class LLMOrchestrator:
    """
    Orquestrador avançado para múltiplos LLMs, com resiliência, cache e consenso.
    """
    def __init__(self, session: aiohttp.ClientSession):
        self._session = session
        self._models: Dict[str, AbstractLLM] = {}
        self._context_router: Dict[str, List[str]] = {}
        self._prompt_templates: Dict[str, PromptTemplate] = {}

        self._circuit_breaker = CircuitBreaker(settings.resilience.circuit_breaker_threshold, settings.resilience.circuit_breaker_reset_sec)
        self._rate_limiter = RateLimiter(settings.resilience.rate_limit_max_calls, settings.resilience.rate_limit_period_sec)
        self._consensus_engine = ConsensusEngine()
        self._cache = AsyncInMemoryCache(ttl_sec=settings.cache.cache_ttl_sec, max_size=settings.cache.cache_max_size)
        
        log.info("LLMOrchestrator instanciado. A aguardar inicialização.")

    async def initialize(self):
        """Inicializa os modelos, roteador e templates. Deve ser chamado no startup da aplicação."""
        self._init_models()
        self._init_context_router()
        self._init_prompt_templates()
        log.info(f"LLMOrchestrator inicializado. Modelos: {list(self._models.keys())}. Templates: {list(self._prompt_templates.keys())}")

    def _init_models(self):
        """Cria as instâncias de todos os modelos LLM configurados."""
        self._models = {
            "llama": OllamaLLM(settings.models.ollama_llama_model, self._session),
            "gemma": OllamaLLM(settings.models.ollama_gemma_model, self._session),
            "qwen": OpenRouterLLM(settings.models.openrouter_qwen_model, self._session),
            "command": CohereLLM("command-r-plus", self._session)
        }

    def _init_context_router(self):
        """Define as regras de roteamento de modelos por contexto."""
        self._context_router = {
            ContextType.GENERAL.value: ["llama", "qwen"],
            ContextType.LEGAL_RESEARCH.value: ["command", "qwen"],
            ContextType.DOCUMENT_ANALYSIS.value: ["command", "gemma"],
        }
    
    def _init_prompt_templates(self):
        """Carrega os templates de prompt que a aplicação irá usar."""
        self._prompt_templates["legal_question"] = PromptTemplate(
            name="legal_question",
            template="Contexto Jurídico: {context}\n\nPergunta do Utilizador: {prompt}",
            variables=["context", "prompt"],
            system_prompt="Você é um assistente jurídico especializado em legislação moçambicana. Seja preciso, objetivo e cite artigos de lei sempre que relevante."
        )

    def _generate_cache_key(self, query: str, context: str, params: GenerationParams) -> str:
        """Gera uma chave de cache única para uma dada consulta e parâmetros."""
        params_json = params.model_dump_json(sort_keys=True)
        return hashlib.sha256(f"{query.strip()}:{context}:{params_json}".encode()).hexdigest()

    async def _query_single_model_with_retry(self, model_name: str, prompt: str, context: str, params: GenerationParams) -> Optional[LLMResponse]:
        """Consulta um único modelo, aplicando Circuit Breaker e lógica de retentativa."""
        if await self._circuit_breaker.is_open(model_name):
            log.warning(f"Consulta ao modelo '{model_name}' pulada, Circuit Breaker está aberto.")
            return None

        model = self._models[model_name]
        last_exception = None

        template = self._prompt_templates.get("legal_question")
        if not template:
            raise LLMOrchestratorError("Template 'legal_question' não foi encontrado.")

        # Aplica o template para formatar o prompt final
        formatted_prompt = template.template.format(context=context, prompt=prompt)

        for attempt in range(settings.orchestrator.default_model_retries + 1):
            try:
                # Passa os parâmetros de geração para o modelo
                response = await model.generate(
                    prompt=formatted_prompt, 
                    context=context, # Contexto ainda pode ser útil separadamente
                    system_prompt=template.system_prompt,
                    params=params
                )
                await self._circuit_breaker.record_success(model_name)
                return response
            except (LLMServiceError, asyncio.TimeoutError) as e:
                last_exception = e
                log.warning(f"Tentativa {attempt + 1} falhou para o modelo '{model_name}': {e}")
                if attempt < settings.orchestrator.default_model_retries:
                    await asyncio.sleep(1.5 ** attempt)  # Backoff exponencial

        await self._circuit_breaker.record_failure(model_name)
        log.error(f"Todas as {settings.orchestrator.default_model_retries + 1} tentativas falharam para '{model_name}'. Erro: {last_exception}")
        return None

    async def generate(
        self,
        query: str,
        context: str,
        user_id: str,
        params: Optional[GenerationParams] = None,
        min_confidence: float = 0.70
    ) -> OrchestratorResponse:
        """Ponto de entrada principal para processar uma consulta."""
        start_time = time.monotonic()
        active_params = params or GenerationParams()

        try:
            if not query or len(query) > settings.orchestrator.max_query_length:
                raise InvalidInputError("Query inválida ou excede o comprimento máximo.")
            await self._rate_limiter.check_limit(user_id)

            cache_key = self._generate_cache_key(query, context, active_params)
            cached_response = await self._cache.get(cache_key)
            if cached_response:
                return cached_response

            model_names = self._context_router.get(context, ["llama"])
            
            tasks = [self._query_single_model_with_retry(name, query, context, active_params) for name in model_names]
            responses = [r for r in await asyncio.gather(*tasks) if r is not None]

            if not responses:
                raise LLMServiceError("Nenhum modelo conseguiu gerar uma resposta válida.")
            
            consensus = self._consensus_engine.get_consensus(responses)
            if consensus["confidence"] < min_confidence:
                raise ConsensusError(f"Confiança da resposta ({consensus['confidence']:.2f}) abaixo do limiar de {min_confidence:.2f}.")

            processing_time_ms = int((time.monotonic() - start_time) * 1000)
            final_response = OrchestratorResponse(
                text=consensus["text"],
                confidence=consensus["confidence"],
                models_used=[r.model_name for r in responses],
                processing_time_ms=processing_time_ms,
                status="success",
                context=context,
                sources=consensus.get("sources", []),
                reasoning=consensus.get("reasoning")
            )

            await self._cache.set(cache_key, final_response)
            return final_response

        except Exception as e:
            processing_time_ms = int((time.monotonic() - start_time) * 1000)
            error_type = type(e).__name__
            log.error(f"Erro durante a orquestração: {e}", exc_info=True)
            
            return OrchestratorResponse(
                text="Lamentamos, ocorreu um erro ao processar a sua requisição.",
                confidence=0.0,
                models_used=[],
                processing_time_ms=processing_time_ms,
                status="error",
                context=context,
                error_type=error_type,
                error_message=str(e)
            )
