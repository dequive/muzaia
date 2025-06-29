backend/app/models/local_llm.py
# -*- coding: utf-8 -*-
"""
Implementação do cliente Ollama alinhada com a arquitetura de protocolos.
"""
import json
import time
import asyncio
import aiohttp
from typing import Optional, Dict, Any, AsyncGenerator

from app.core.config import settings
from app.core.exceptions import *
from app.schemas import LLMResponse, GenerationParams
from app.models.base_llm import BaseLLM
from app.core.protocols import LLMStreamChunk

class OllamaStreamChunk(LLMStreamChunk):
    """Implementação concreta de um chunk de streaming para Ollama."""
    def __init__(self, chunk: Dict[str, Any], model_name: str):
        self._chunk = chunk
        self._model_name = model_name

    @property
    def content(self) -> str:
        return self._chunk.get("response", "")

    @property
    def is_final(self) -> bool:
        return self._chunk.get("done", False)

    @property
    def metadata(self) -> Optional[Dict[str, Any]]:
        if self.is_final:
            return {
                "model_name": self._model_name,
                "total_duration_ns": self._chunk.get("total_duration"),
                "prompt_eval_count": self._chunk.get("prompt_eval_count"),
                "eval_count": self._chunk.get("eval_count"),
            }
        return None

class OllamaLLM(BaseLLM):
    """Cliente Ollama que implementa o protocolo AbstractLLM completo."""

    def __init__(self, model_name: str, session: Optional[aiohttp.ClientSession] = None):
        super().__init__(model_name, session)
        self._base_url = settings.models.ollama_base_url

    def _prepare_payload(self, prompt: str, context: str, system_prompt: Optional[str], params: GenerationParams) -> Dict[str, Any]:
        full_prompt = f"Contexto: {context}\n\nPergunta: {prompt}" if context else prompt
        return {
            "model": self.model_name,
            "system": system_prompt,
            "prompt": full_prompt,
            "options": params.model_dump(exclude_none=True)
        }

    async def _make_request(self, endpoint: str, payload: Dict, stream: bool) -> aiohttp.ClientResponse:
        if not self._session or self._session.closed:
            raise LLMConnectionError("Sessão aiohttp não está disponível ou está fechada.", self.model_name)
        
        try:
            return await self._session.post(f"{self._base_url}{endpoint}", json=payload, timeout=aiohttp.ClientTimeout(total=60))
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise LLMConnectionError(f"Erro de comunicação com o serviço Ollama: {e}", self.model_name) from e

    async def generate(self, prompt: str, context: str = "", system_prompt: Optional[str] = None, params: Optional[GenerationParams] = None) -> LLMResponse:
        params = params or GenerationParams()
        payload = self._prepare_payload(prompt, context, system_prompt, params)
        payload["stream"] = False
        
        start_time = time.monotonic()
        resp = await self._make_request("/api/generate", payload, stream=False)
        
        if resp.status == 404:
            raise ModelNotFoundError(f"Modelo '{self.model_name}' não encontrado no Ollama.", self.model_name)
        resp.raise_for_status()
        
        try:
            result = await resp.json()
            return LLMResponse(
                model_name=self.model_name,
                text=result.get("response", "").strip(),
                confidence=0.8, # Heurística
                latency_ms=int((time.monotonic() - start_time) * 1000),
                tokens_used=result.get("eval_count")
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise LLMInvalidResponseError(f"Resposta inválida do Ollama: {e}", self.model_name) from e

    async def stream_generate(self, prompt: str, context: str = "", system_prompt: Optional[str] = None, params: Optional[GenerationParams] = None) -> AsyncGenerator[LLMStreamChunk, None]:
        params = params or GenerationParams()
        payload = self._prepare_payload(prompt, context, system_prompt, params)
        payload["stream"] = True

        resp = await self._make_request("/api/generate", payload, stream=True)
        
        if resp.status == 404:
            raise ModelNotFoundError(f"Modelo '{self.model_name}' não encontrado no Ollama.", self.model_name)
        resp.raise_for_status()

        async for line in resp.content:
            if line:
                try:
                    chunk_data = json.loads(line.decode('utf-8'))
                    yield OllamaStreamChunk(chunk_data, self.model_name)
                except json.JSONDecodeError:
                    self.log.warning(f"Ignorando linha de stream mal formada: {line}")
                    continue

    async def health_check(self) -> bool:
        try:
            async with self._session.get(self._base_url, timeout=5) as resp:
                return resp.status == 200
        except Exception:
            return False

    async def get_model_info(self) -> Dict[str, Any]:
        try:
            resp = await self._make_request("/api/show", {"name": self.model_name}, stream=False)
            if resp.status == 404:
                return {"error": "Model not found"}
            resp.raise_for_status()
            return await resp.json()
        except Exception as e:
            return {"error": str(e)}
