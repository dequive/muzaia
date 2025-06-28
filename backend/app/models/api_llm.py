# -*- coding: utf-8 -*-
"""
Implementações de modelos de linguagem (LLMs) acedidos via APIs externas.

Cada classe implementa a interface definida em BaseLLM e lida com a
lógica específica de comunicação e tradução de parâmetros para a sua API.
"""

import time
import asyncio
import aiohttp
from typing import Optional

from app.core.config import settings
from app.core.exceptions import LLMServiceError
from app.schemas import LLMResponse, GenerationParams
from app.models.base_llm import BaseLLM

class OpenRouterLLM(BaseLLM):
    """Implementação para modelos acedidos através da API do OpenRouter."""

    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        super().__init__(model_name, session)
        self._api_key = settings.models.openrouter_api_key.get_secret_value()
        self._base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        start_time = time.monotonic()
        active_params = params or GenerationParams()

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "HTTP-Referer": "https://mozaia.mz",
            "X-Title": "Mozaia Legal Assistant"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt or "Você é um assistente jurídico de elite."},
                {"role": "user", "content": prompt} # O prompt já vem formatado do orquestrador
            ],
            # Tradução dos nossos GenerationParams para o formato da API OpenRouter
            "temperature": active_params.temperature,
            "top_p": active_params.top_p,
            "max_tokens": active_params.max_tokens,
            "frequency_penalty": active_params.frequency_penalty,
            "presence_penalty": active_params.presence_penalty,
            "seed": active_params.seed,
        }
        
        try:
            timeout = aiohttp.ClientTimeout(total=active_params.timeout)
            async with self._session.post(self._base_url, json={k: v for k, v in payload.items() if v is not None}, headers=headers, timeout=timeout) as resp:
                resp.raise_for_status()
                result = await resp.json()
                
                text = result["choices"][0]["message"]["content"].strip()
                tokens = result.get("usage", {}).get("total_tokens")
                
                return LLMResponse(
                    model_name=self.model_name,
                    text=text,
                    confidence=0.85,
                    latency_ms=int((time.monotonic() - start_time) * 1000),
                    tokens_used=tokens
                )
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError) as e:
            self.log.error(f"Falha ao consultar OpenRouter para '{self.model_name}': {e}", exc_info=True)
            raise LLMServiceError(f"Erro de comunicação com a API OpenRouter: {e}") from e

class CohereLLM(BaseLLM):
    """Implementação para modelos acedidos através da API do Cohere."""

    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        super().__init__(model_name, session)
        self._api_key = settings.models.cohere_api_key.get_secret_value()
        self._base_url = "https://api.cohere.ai/v1/chat"

    async def generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        start_time = time.monotonic()
        active_params = params or GenerationParams()

        headers = {"Authorization": f"Bearer {self._api_key}"}
        payload = {
            "model": self.model_name,
            "preamble": system_prompt or "Você é um assistente jurídico de elite.",
            "message": prompt, # O prompt já vem formatado
            # Tradução dos nossos GenerationParams para o formato da API Cohere
            "temperature": active_params.temperature,
            "p": active_params.top_p,
            "k": active_params.top_k,
            "max_tokens": active_params.max_tokens,
            "frequency_penalty": active_params.frequency_penalty,
            "presence_penalty": active_params.presence_penalty,
            "seed": active_params.seed,
        }

        try:
            timeout = aiohttp.ClientTimeout(total=active_params.timeout)
            async with self._session.post(self._base_url, json={k: v for k, v in payload.items() if v is not None}, headers=headers, timeout=timeout) as resp:
                resp.raise_for_status()
                result = await resp.json()

                tokens_info = result.get("meta", {}).get("billed_units", {})
                tokens_used = tokens_info.get("input_tokens", 0) + tokens_info.get("output_tokens", 0)
                
                return LLMResponse(
                    model_name=self.model_name,
                    text=result["text"].strip(),
                    confidence=0.88,
                    latency_ms=int((time.monotonic() - start_time) * 1000),
                    tokens_used=tokens_used if tokens_used > 0 else None
                )
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError) as e:
            self.log.error(f"Falha ao consultar Cohere: {e}", exc_info=True)
            raise LLMServiceError(f"Erro de comunicação com a API Cohere: {e}") from e
