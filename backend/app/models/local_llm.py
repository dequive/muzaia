#backend/app/models/local_llm.py
# -*- coding: utf-8 -*-
"""
Cliente para modelos LLM locais via Ollama.
"""
import asyncio
import logging
from typing import Dict, Any, Optional
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.exceptions import LLMConnectionError, LLMInvalidResponseError
from app.schemas import LLMResponse, GenerationParams

logger = logging.getLogger(__name__)


class OllamaLLM:
    """Cliente para modelos Ollama locais."""

    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        self.model_name = model_name
        self.base_url = settings.models.ollama_base_url
        self._session = session
        self.timeout = aiohttp.ClientTimeout(total=settings.orchestrator.request_timeout)

    async def __aenter__(self):
        """Context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        pass

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """
        Gera uma resposta usando Ollama.
        
        Args:
            prompt: Prompt principal
            context: Contexto adicional
            system_prompt: Prompt do sistema
            params: Parâmetros de geração
            
        Returns:
            LLMResponse com a resposta gerada
        """
        try:
            # Construir prompt completo
            full_prompt = self._build_prompt(prompt, context, system_prompt)
            
            # Parâmetros de geração
            generation_params = self._build_params(params)
            
            payload = {
                "model": self.model_name,
                "prompt": full_prompt,
                "stream": False,
                "options": generation_params
            }

            start_time = asyncio.get_event_loop().time()
            
            async with self._session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Ollama API retornou status {response.status}: {error_text}"
                    )
                
                result = await response.json()
                processing_time = asyncio.get_event_loop().time() - start_time
                
                return self._parse_response(result, processing_time)

        except aiohttp.ClientError as e:
            logger.error(f"Erro de conexão com Ollama: {e}")
            raise LLMConnectionError(f"Erro de conexão: {str(e)}")
        except Exception as e:
            logger.error(f"Erro inesperado no Ollama: {e}")
            raise LLMInvalidResponseError(f"Erro inesperado: {str(e)}")

    async def stream_generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ):
        """
        Gera uma resposta em streaming.
        
        Args:
            prompt: Prompt principal
            context: Contexto adicional
            system_prompt: Prompt do sistema
            params: Parâmetros de geração
            
        Yields:
            Chunks da resposta em streaming
        """
        try:
            full_prompt = self._build_prompt(prompt, context, system_prompt)
            generation_params = self._build_params(params)
            
            payload = {
                "model": self.model_name,
                "prompt": full_prompt,
                "stream": True,
                "options": generation_params
            }

            async with self._session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Ollama API retornou status {response.status}: {error_text}"
                    )
                
                async for line in response.content:
                    if line:
                        try:
                            import json
                            chunk = json.loads(line.decode('utf-8'))
                            
                            yield {
                                "content": chunk.get("response", ""),
                                "is_final": chunk.get("done", False),
                                "metadata": {
                                    "model": self.model_name,
                                    "tokens": chunk.get("eval_count", 0)
                                }
                            }
                            
                            if chunk.get("done", False):
                                break
                                
                        except json.JSONDecodeError:
                            continue

        except aiohttp.ClientError as e:
            logger.error(f"Erro de conexão com Ollama streaming: {e}")
            raise LLMConnectionError(f"Erro de conexão streaming: {str(e)}")

    async def health_check(self) -> bool:
        """
        Verifica se o modelo está disponível.
        
        Returns:
            True se o modelo estiver disponível
        """
        try:
            async with self._session.get(
                f"{self.base_url}/api/tags",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                if response.status != 200:
                    return False
                
                data = await response.json()
                models = [model["name"] for model in data.get("models", [])]
                
                return self.model_name in models

        except Exception as e:
            logger.warning(f"Health check falhou para {self.model_name}: {e}")
            return False

    async def get_model_info(self) -> Dict[str, Any]:
        """
        Obtém informações sobre o modelo.
        
        Returns:
            Informações do modelo
        """
        try:
            async with self._session.post(
                f"{self.base_url}/api/show",
                json={"name": self.model_name},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"Status {response.status}"}

        except Exception as e:
            return {"error": str(e)}

    async def close(self) -> None:
        """Fecha recursos associados ao modelo."""
        # Ollama não requer cleanup específico
        pass

    def _build_prompt(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None
    ) -> str:
        """Constrói o prompt completo."""
        parts = []
        
        if system_prompt:
            parts.append(f"SISTEMA: {system_prompt}")
        else:
            parts.append("SISTEMA: Você é um assistente jurídico especializado em legislação moçambicana. Responda de forma precisa e citando artigos relevantes quando possível.")
        
        if context:
            parts.append(f"CONTEXTO: {context}")
        
        parts.append(f"PERGUNTA: {prompt}")
        parts.append("RESPOSTA:")
        
        return "\n\n".join(parts)

    def _build_params(self, params: Optional[GenerationParams]) -> Dict[str, Any]:
        """Constrói parâmetros de geração."""
        if not params:
            params = GenerationParams()
        
        return {
            "temperature": params.temperature or 0.7,
            "num_predict": params.max_tokens or 1000,
            "top_p": params.top_p or 0.9,
            "top_k": params.top_k or 50,
            "repeat_penalty": 1.1
        }

    def _parse_response(self, result: Dict[str, Any], processing_time: float) -> LLMResponse:
        """Faz parse da resposta do Ollama."""
        if "error" in result:
            raise LLMInvalidResponseError(f"Erro do Ollama: {result['error']}")
        
        response_text = result.get("response", "")
        if not response_text:
            raise LLMInvalidResponseError("Resposta vazia do Ollama")
        
        return LLMResponse(
            text=response_text.strip(),
            model=self.model_name,
            tokens_used=result.get("eval_count", 0),
            processing_time=processing_time,
            cost=0.0,  # Ollama é gratuito
            metadata={
                "total_duration": result.get("total_duration", 0),
                "load_duration": result.get("load_duration", 0),
                "prompt_eval_count": result.get("prompt_eval_count", 0),
                "eval_count": result.get("eval_count", 0),
                "eval_duration": result.get("eval_duration", 0)
            }
        )
