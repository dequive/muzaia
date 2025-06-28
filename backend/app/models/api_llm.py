# -*- coding: utf-8 -*-
"""
Implementações de modelos de linguagem (LLMs) acedidos via APIs externas.

Cada classe implementa a interface definida em BaseLLM e lida com a
lógica específica de comunicação com a sua respectiva API.
"""

import time
import asyncio
import aiohttp

from app.core.config import settings
from app.core.exceptions import LLMServiceError
from app.schemas import LLMResponse
from app.models.base_llm import BaseLLM

class OpenRouterLLM(BaseLLM):
    """Implementação para modelos acedidos através da API do OpenRouter."""

    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        """
        Inicializa o cliente para um modelo específico do OpenRouter.

        Args:
            model_name: O nome do modelo a ser usado (ex: 'qwen/qwen-2.5-72b-instruct').
            session: A sessão aiohttp.ClientSession partilhada pela aplicação.
        """
        super().__init__(model_name, session)
        self._api_key = settings.models.openrouter_api_key.get_secret_value()
        self._base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def generate(self, prompt: str, context: str) -> LLMResponse:
        start_time = time.monotonic()
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "HTTP-Referer": "https://mozaia.mz",  # Boa prática recomendada pelo OpenRouter
            "X-Title": "Mozaia Legal Assistant"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "Você é um assistente jurídico de elite, focado na lei de Moçambique. Seja preciso e direto."},
                {"role": "user", "content": f"Contexto: {context}\n\nPergunta: {prompt}"}
            ]
        }
        
        try:
            timeout = aiohttp.ClientTimeout(total=settings.orchestrator.default_model_timeout_sec)
            async with self._session.post(self._base_url, json=payload, headers=headers, timeout=timeout) as resp:
                resp.raise_for_status()
                result = await resp.json()
                
                text = result["choices"][0]["message"]["content"].strip()
                tokens = result.get("usage", {}).get("total_tokens")
                
                return LLMResponse(
                    model_name=self.model_name,
                    text=text,
                    confidence=0.85,  # Heurística, pois a API não fornece este dado
                    latency_ms=int((time.monotonic() - start_time) * 1000),
                    tokens_used=tokens
                )
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError) as e:
            self.log.error(f"Falha ao consultar OpenRouter para o modelo '{self.model_name}': {e}", exc_info=True)
            raise LLMServiceError(f"Erro de comunicação com a API OpenRouter: {e}") from e

class CohereLLM(BaseLLM):
    """Implementação para modelos acedidos através da API do Cohere."""

    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        """
        Inicializa o cliente para um modelo específico do Cohere.

        Args:
            model_name: O nome do modelo a ser usado (ex: 'command-r-plus').
            session: A sessão aiohttp.ClientSession partilhada pela aplicação.
        """
        super().__init__(model_name, session)
        self._api_key = settings.models.cohere_api_key.get_secret_value()
        self._base_url = "https://api.cohere.ai/v1/chat"

    async def generate(self, prompt: str, context: str) -> LLMResponse:
        start_time = time.monotonic()
        headers = {"Authorization": f"Bearer {self._api_key}"}
        payload = {
            "model": self.model_name,
            "preamble": f"Você é um assistente jurídico de elite, focado na lei de Moçambique. O contexto da consulta é: {context}.",
            "message": prompt
        }

        try:
            timeout = aiohttp.ClientTimeout(total=settings.orchestrator.default_model_timeout_sec)
            async with self._session.post(self._base_url, json=payload, headers=headers, timeout=timeout) as resp:
                resp.raise_for_status()
                result = await resp.json()

                tokens_info = result.get("meta", {}).get("billed_units", {})
                tokens_used = tokens_info.get("input_tokens", 0) + tokens_info.get("output_tokens", 0)
                
                return LLMResponse(
                    model_name=self.model_name,
                    text=result["text"].strip(),
                    confidence=0.88,  # Heurística
                    latency_ms=int((time.monotonic() - start_time) * 1000),
                    tokens_used=tokens_used if tokens_used > 0 else None
                )
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError) as e:
            self.log.error(f"Falha ao consultar Cohere: {e}", exc_info=True)
            raise LLMServiceError(f"Erro de comunicação com a API Cohere: {e}") from e
