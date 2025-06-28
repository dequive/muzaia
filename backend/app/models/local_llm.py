backend/app/models/local_llm.py
# -*- coding: utf-8 -*-
"""
Implementação de modelos de linguagem (LLMs) acedidos localmente
através do serviço Ollama.
"""

import time
import asyncio
import aiohttp
from typing import Optional

from app.core.config import settings
from app.core.exceptions import LLMServiceError
from app.schemas import LLMResponse, GenerationParams
from app.models.base_llm import BaseLLM

class OllamaLLM(BaseLLM):
    """
    Cliente stateless para modelos servidos pelo Ollama.
    A sua única responsabilidade é formatar pedidos e analisar respostas da API Ollama.
    Toda a lógica de resiliência e de negócio é tratada pelo Orquestrador.
    """

    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        """
        Inicializa o cliente para um modelo específico do Ollama.

        Args:
            model_name: O nome do modelo registado no Ollama (ex: 'llama3:8b').
            session: A sessão aiohttp.ClientSession partilhada pela aplicação.
        """
        super().__init__(model_name, session)
        self._base_url = f"{settings.models.ollama_base_url}/api/generate"

    async def generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """
        Gera uma resposta a partir do modelo Ollama.
        """
        start_time = time.monotonic()
        
        active_params = params or GenerationParams()

        final_system_prompt = system_prompt or "Você é um assistente jurídico especializado em legislação moçambicana. Seja preciso e objetivo."
        full_prompt = f"Contexto Jurídico: {context}\n\nPergunta do Utilizador: {prompt}"
        
        payload = {
            "model": self.model_name,
            "system": final_system_prompt,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": active_params.temperature,
                "top_p": active_params.top_p,
                "top_k": active_params.top_k,
                "num_predict": active_params.max_tokens,
                "repeat_penalty": active_params.repeat_penalty,
                "seed": active_params.seed,
                "frequency_penalty": active_params.frequency_penalty,
                "presence_penalty": active_params.presence_penalty,
            }
        }

        try:
            timeout = aiohttp.ClientTimeout(total=active_params.timeout)
            async with self._session.post(self._base_url, json=payload, timeout=timeout) as resp:
                if resp.status == 404:
                    raise LLMServiceError(f"Modelo '{self.model_name}' não encontrado no serviço Ollama.")
                
                resp.raise_for_status()
                result = await resp.json()
                
                return LLMResponse(
                    model_name=self.model_name,
                    text=result.get("response", "").strip(),
                    confidence=0.80,  # Heurística para modelos locais
                    latency_ms=int((time.monotonic() - start_time) * 1000),
                    tokens_used=result.get("eval_count")
                )
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError) as e:
            self.log.error(f"Falha ao consultar o modelo local Ollama '{self.model_name}': {e}", exc_info=True)
            raise LLMServiceError(f"Erro de comunicação com o serviço Ollama: {e}") from e
