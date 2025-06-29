# -*- coding: utf-8 -*-
"""
Implementação de clientes de API (OpenRouter, Cohere) alinhados
com a arquitetura de protocolos.
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

# --- Implementação de Chunks para OpenRouter ---
class OpenRouterStreamChunk(LLMStreamChunk):
    def __init__(self, chunk: Dict[str, Any]):
        self._chunk = chunk
        self._delta = chunk.get("choices", [{}])[0].get("delta", {})

    @property
    def content(self) -> str:
        return self._delta.get("content", "") or ""

    @property
    def is_final(self) -> bool:
        # OpenRouter envia um 'finish_reason' no último chunk
        return self._chunk.get("choices", [{}])[0].get("finish_reason") is not None

    @property
    def metadata(self) -> Optional[Dict[str, Any]]:
        if self.is_final:
            return { "finish_reason": self._chunk.get("choices", [{}])[0].get("finish_reason") }
        return None

class OpenRouterLLM(BaseLLM):
    """Cliente OpenRouter que implementa o protocolo AbstractLLM completo."""

    def __init__(self, model_name: str, session: Optional[aiohttp.ClientSession] = None):
        super().__init__(model_name, session)
        self._api_key = settings.models.openrouter_api_key.get_secret_value()
        self._base_url = "https://openrouter.ai/api/v1/chat/completions"
        self._headers = {
            "Authorization": f"Bearer {self._api_key}",
            "HTTP-Referer": "https://mozaia.mz",
            "X-Title": "Mozaia Legal Assistant"
        }

    async def generate(self, prompt: str, context: str = "", system_prompt: Optional[str] = None, params: Optional[GenerationParams] = None) -> LLMResponse:
        # A implementação de generate pode chamar stream_generate para evitar duplicação de código
        full_response = ""
        final_chunk = None
        async for chunk in self.stream_generate(prompt, context, system_prompt, params):
            full_response += chunk.content
            if chunk.is_final:
                final_chunk = chunk
        
        return LLMResponse(
            model_name=self.model_name,
            text=full_response.strip(),
            confidence=0.85, # Heurística
            latency_ms=0, # Não é trivial calcular aqui, orquestrador pode fazer
            tokens_used=final_chunk.metadata.get("total_tokens") if final_chunk else None
        )

    async def stream_generate(self, prompt: str, context: str = "", system_prompt: Optional[str] = None, params: Optional[GenerationParams] = None) -> AsyncGenerator[LLMStreamChunk, None]:
        if not self._session or self._session.closed:
            raise LLMConnectionError("Sessão aiohttp não está disponível.", self.model_name)
            
        params = params or GenerationParams()
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt or "Você é um assistente jurídico."},
                {"role": "user", "content": f"Contexto: {context}\n\nPergunta: {prompt}" if context else prompt}
            ],
            "stream": True,
            **params.model_dump(exclude={"timeout"}, exclude_none=True)
        }

        try:
            async with self._session.post(self._base_url, json=payload, headers=self._headers, timeout=aiohttp.ClientTimeout(total=params.timeout)) as resp:
                if resp.status == 429:
                    raise LLMRateLimitError("Limite de taxa excedido na API OpenRouter.", self.model_name)
                resp.raise_for_status()
                
                async for line in resp.content:
                    if line.startswith(b'data: '):
                        line_content = line[6:].strip()
                        if line_content == b'[DONE]':
                            break
                        if line_content:
                            chunk_data = json.loads(line_content)
                            yield OpenRouterStreamChunk(chunk_data)

        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise LLMConnectionError(f"Erro de comunicação com OpenRouter: {e}", self.model_name) from e
        except json.JSONDecodeError as e:
            raise LLMInvalidResponseError(f"Resposta inválida de OpenRouter: {e}", self.model_name) from e

    async def health_check(self) -> bool:
        # O OpenRouter não tem um endpoint de health-check público,
        # então verificamos a autenticação fazendo um pedido barato.
        try:
            async with self._session.post(self._base_url, json={"model": self.model_name, "messages": [], "max_tokens": 1}, headers=self._headers, timeout=10) as resp:
                # 400 (Bad Request) é esperado porque as mensagens estão vazias, mas significa que a API está viva.
                return resp.status in [200, 400]
        except Exception:
            return False

    async def get_model_info(self) -> Dict[str, Any]:
        # A API de Chat/Completions não fornece info detalhada.
        # Uma API mais completa do OpenRouter seria necessária.
        return {"model_name": self.model_name, "provider": "OpenRouter", "details": "Informação detalhada não disponível via esta API."}

# Nota: A implementação para CohereLLM seguiria um padrão semelhante.
# Por uma questão de brevidade, focaremos a fábrica nos modelos já refatorados.
