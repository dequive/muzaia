# -*- coding: utf-8 -*-
"""
Clientes para LLMs via APIs externas (OpenRouter, Cohere).
"""
import asyncio
import logging
from typing import Dict, Any, Optional
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.exceptions import LLMConnectionError, LLMRateLimitError, LLMInvalidResponseError
from app.schemas import LLMResponse, GenerationParams

logger = logging.getLogger(__name__)


class OpenRouterLLM:
    """Cliente para modelos via OpenRouter."""

    def __init__(self, model_name: str, session: aiohttp.ClientSession):
        self.model_name = model_name
        self.api_key = settings.models.openrouter_api_key
        self.base_url = "https://openrouter.ai/api/v1"
        self._session = session
        self.timeout = aiohttp.ClientTimeout(total=settings.orchestrator.request_timeout)

        if not self.api_key:
            logger.warning("OpenRouter API key não configurada")

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
        Gera uma resposta usando OpenRouter.
        
        Args:
            prompt: Prompt principal
            context: Contexto adicional
            system_prompt: Prompt do sistema
            params: Parâmetros de geração
            
        Returns:
            LLMResponse com a resposta gerada
        """
        if not self.api_key:
            raise LLMConnectionError("OpenRouter API key não configurada")

        try:
            headers = self._build_headers()
            messages = self._build_messages(prompt, context, system_prompt)
            generation_params = self._build_params(params)
            
            payload = {
                "model": self.model_name,
                "messages": messages,
                **generation_params
            }

            start_time = asyncio.get_event_loop().time()
            
            async with self._session.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=self.timeout
            ) as response:
                
                processing_time = asyncio.get_event_loop().time() - start_time
                
                if response.status == 429:
                    raise LLMRateLimitError("Rate limit excedido no OpenRouter")
                elif response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"OpenRouter API retornou status {response.status}: {error_text}"
                    )
                
                result = await response.json()
                return self._parse_response(result, processing_time)

        except aiohttp.ClientError as e:
            logger.error(f"Erro de conexão com OpenRouter: {e}")
            raise LLMConnectionError(f"Erro de conexão: {str(e)}")
        except LLMRateLimitError:
            raise
        except Exception as e:
            logger.error(f"Erro inesperado no OpenRouter: {e}")
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
        if not self.api_key:
            raise LLMConnectionError("OpenRouter API key não configurada")

        try:
            headers = self._build_headers()
            messages = self._build_messages(prompt, context, system_prompt)
            generation_params = self._build_params(params)
            
            payload = {
                "model": self.model_name,
                "messages": messages,
                "stream": True,
                **generation_params
            }

            async with self._session.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=self.timeout
            ) as response:
                
                if response.status == 429:
                    raise LLMRateLimitError("Rate limit excedido no OpenRouter")
                elif response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"OpenRouter API retornou status {response.status}: {error_text}"
                    )
                
                async for line in response.content:
                    if line:
                        line_str = line.decode('utf-8').strip()
                        if line_str.startswith('data: '):
                            data_str = line_str[6:]
                            if data_str == '[DONE]':
                                break
                            
                            try:
                                import json
                                chunk = json.loads(data_str)
                                
                                if 'choices' in chunk and chunk['choices']:
                                    delta = chunk['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    
                                    yield {
                                        "content": content,
                                        "is_final": chunk['choices'][0].get('finish_reason') is not None,
                                        "metadata": {
                                            "model": self.model_name,
                                            "usage": chunk.get('usage', {})
                                        }
                                    }
                                    
                            except json.JSONDecodeError:
                                continue

        except aiohttp.ClientError as e:
            logger.error(f"Erro de conexão com OpenRouter streaming: {e}")
            raise LLMConnectionError(f"Erro de conexão streaming: {str(e)}")

    async def health_check(self) -> bool:
        """
        Verifica se a API está disponível.
        
        Returns:
            True se a API estiver disponível
        """
        if not self.api_key:
            return False

        try:
            headers = self._build_headers()
            
            async with self._session.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                return response.status == 200

        except Exception as e:
            logger.warning(f"Health check falhou para OpenRouter: {e}")
            return False

    async def get_model_info(self) -> Dict[str, Any]:
        """
        Obtém informações sobre o modelo.
        
        Returns:
            Informações do modelo
        """
        if not self.api_key:
            return {"error": "API key não configurada"}

        try:
            headers = self._build_headers()
            
            async with self._session.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    models = data.get("data", [])
                    for model in models:
                        if model.get("id") == self.model_name:
                            return model
                    return {"error": "Modelo não encontrado"}
                else:
                    return {"error": f"Status {response.status}"}

        except Exception as e:
            return {"error": str(e)}

    async def close(self) -> None:
        """Fecha recursos associados ao modelo."""
        # OpenRouter não requer cleanup específico
        pass

    def _build_headers(self) -> Dict[str, str]:
        """Constrói headers para requisições."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mozaia.mz",
            "X-Title": "Mozaia Legal Assistant"
        }

    def _build_messages(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None
    ) -> list:
        """Constrói mensagens para o formato de chat."""
        messages = []
        
        system_msg = system_prompt or (
            "Você é um assistente jurídico especializado em legislação moçambicana. "
            "Responda de forma precisa e citando artigos relevantes quando possível."
        )
        messages.append({"role": "system", "content": system_msg})
        
        user_content = prompt
        if context:
            user_content = f"Contexto: {context}\n\nPergunta: {prompt}"
        
        messages.append({"role": "user", "content": user_content})
        
        return messages

    def _build_params(self, params: Optional[GenerationParams]) -> Dict[str, Any]:
        """Constrói parâmetros de geração."""
        if not params:
            params = GenerationParams()
        
        return {
            "temperature": params.temperature or 0.7,
            "max_tokens": params.max_tokens or 1000,
            "top_p": params.top_p or 0.9,
            "frequency_penalty": params.frequency_penalty or 0.0,
            "presence_penalty": params.presence_penalty or 0.0
        }

    def _parse_response(self, result: Dict[str, Any], processing_time: float) -> LLMResponse:
        """Faz parse da resposta do OpenRouter."""
        if "error" in result:
            raise LLMInvalidResponseError(f"Erro do OpenRouter: {result['error']}")
        
        if "choices" not in result or not result["choices"]:
            raise LLMInvalidResponseError("Resposta inválida do OpenRouter")
        
        choice = result["choices"][0]
        message = choice.get("message", {})
        content = message.get("content", "")
        
        if not content:
            raise LLMInvalidResponseError("Resposta vazia do OpenRouter")
        
        usage = result.get("usage", {})
        total_tokens = usage.get("total_tokens", 0)
        
        # Estimar custo (valores aproximados para Qwen)
        cost_per_token = 0.0000005  # $0.50 por 1M tokens
        estimated_cost = total_tokens * cost_per_token
        
        return LLMResponse(
            text=content.strip(),
            model=self.model_name,
            tokens_used=total_tokens,
            processing_time=processing_time,
            cost=estimated_cost,
            metadata={
                "usage": usage,
                "finish_reason": choice.get("finish_reason"),
                "provider": "openrouter"
            }
        )


class CohereLLM:
    """Cliente para modelos Cohere."""

    def __init__(self, model_name: str = None, session: aiohttp.ClientSession = None):
        self.model_name = model_name or settings.models.cohere_model
        self.api_key = settings.models.cohere_api_key
        self.base_url = "https://api.cohere.ai/v1"
        self._session = session
        self.timeout = aiohttp.ClientTimeout(total=settings.orchestrator.request_timeout)

        if not self.api_key:
            logger.warning("Cohere API key não configurada")

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
        Gera uma resposta usando Cohere.
        
        Args:
            prompt: Prompt principal
            context: Contexto adicional
            system_prompt: Prompt do sistema
            params: Parâmetros de geração
            
        Returns:
            LLMResponse com a resposta gerada
        """
        if not self.api_key:
            raise LLMConnectionError("Cohere API key não configurada")

        try:
            headers = self._build_headers()
            full_prompt = self._build_prompt(prompt, context, system_prompt)
            generation_params = self._build_params(params)
            
            payload = {
                "model": self.model_name,
                "prompt": full_prompt,
                **generation_params
            }

            start_time = asyncio.get_event_loop().time()
            
            async with self._session.post(
                f"{self.base_url}/generate",
                json=payload,
                headers=headers,
                timeout=self.timeout
            ) as response:
                
                processing_time = asyncio.get_event_loop().time() - start_time
                
                if response.status == 429:
                    raise LLMRateLimitError("Rate limit excedido no Cohere")
                elif response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Cohere API retornou status {response.status}: {error_text}"
                    )
                
                result = await response.json()
                return self._parse_response(result, processing_time)

        except aiohttp.ClientError as e:
            logger.error(f"Erro de conexão com Cohere: {e}")
            raise LLMConnectionError(f"Erro de conexão: {str(e)}")
        except LLMRateLimitError:
            raise
        except Exception as e:
            logger.error(f"Erro inesperado no Cohere: {e}")
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
        if not self.api_key:
            raise LLMConnectionError("Cohere API key não configurada")

        try:
            headers = self._build_headers()
            full_prompt = self._build_prompt(prompt, context, system_prompt)
            generation_params = self._build_params(params)
            
            payload = {
                "model": self.model_name,
                "prompt": full_prompt,
                "stream": True,
                **generation_params
            }

            async with self._session.post(
                f"{self.base_url}/generate",
                json=payload,
                headers=headers,
                timeout=self.timeout
            ) as response:
                
                if response.status == 429:
                    raise LLMRateLimitError("Rate limit excedido no Cohere")
                elif response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Cohere API retornou status {response.status}: {error_text}"
                    )
                
                async for line in response.content:
                    if line:
                        try:
                            import json
                            chunk = json.loads(line.decode('utf-8'))
                            
                            if 'text' in chunk:
                                yield {
                                    "content": chunk['text'],
                                    "is_final": chunk.get('is_finished', False),
                                    "metadata": {
                                        "model": self.model_name,
                                        "finish_reason": chunk.get('finish_reason'),
                                        "provider": "cohere"
                                    }
                                }
                                
                                if chunk.get('is_finished', False):
                                    break
                                    
                        except json.JSONDecodeError:
                            continue

        except aiohttp.ClientError as e:
            logger.error(f"Erro de conexão com Cohere streaming: {e}")
            raise LLMConnectionError(f"Erro de conexão streaming: {str(e)}")

    async def health_check(self) -> bool:
        """
        Verifica se a API está disponível.
        
        Returns:
            True se a API estiver disponível
        """
        if not self.api_key:
            return False

        try:
            headers = self._build_headers()
            
            # Teste simples com prompt mínimo
            payload = {
                "model": self.model_name,
                "prompt": "test",
                "max_tokens": 1
            }
            
            async with self._session.post(
                f"{self.base_url}/generate",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                return response.status == 200

        except Exception as e:
            logger.warning(f"Health check falhou para Cohere: {e}")
            return False

    async def get_model_info(self) -> Dict[str, Any]:
        """
        Obtém informações sobre o modelo.
        
        Returns:
            Informações do modelo
        """
        if not self.api_key:
            return {"error": "API key não configurada"}

        return {
            "model": self.model_name,
            "provider": "cohere",
            "type": "generative",
            "max_tokens": 4000
        }

    async def close(self) -> None:
        """Fecha recursos associados ao modelo."""
        # Cohere não requer cleanup específico
        pass

    def _build_headers(self) -> Dict[str, str]:
        """Constrói headers para requisições."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozaia/1.0"
        }

    def _build_prompt(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None
    ) -> str:
        """Constrói o prompt completo."""
        parts = []
        
        if system_prompt:
            parts.append(system_prompt)
        else:
            parts.append(
                "Você é um assistente jurídico especializado em legislação moçambicana. "
                "Responda de forma precisa e citando artigos relevantes quando possível."
            )
        
        if context:
            parts.append(f"Contexto: {context}")
        
        parts.append(f"Pergunta: {prompt}")
        parts.append("Resposta:")
        
        return "\n\n".join(parts)

    def _build_params(self, params: Optional[GenerationParams]) -> Dict[str, Any]:
        """Constrói parâmetros de geração."""
        if not params:
            params = GenerationParams()
        
        return {
            "temperature": params.temperature or 0.7,
            "max_tokens": params.max_tokens or 1000,
            "p": params.top_p or 0.9,
            "k": params.top_k or 50,
            "frequency_penalty": params.frequency_penalty or 0.0,
            "presence_penalty": params.presence_penalty or 0.0
        }

    def _parse_response(self, result: Dict[str, Any], processing_time: float) -> LLMResponse:
        """Faz parse da resposta do Cohere."""
        if "message" in result:
            raise LLMInvalidResponseError(f"Erro do Cohere: {result['message']}")
        
        if "generations" not in result or not result["generations"]:
            raise LLMInvalidResponseError("Resposta inválida do Cohere")
        
        generation = result["generations"][0]
        text = generation.get("text", "")
        
        if not text:
            raise LLMInvalidResponseError("Resposta vazia do Cohere")
        
        # Estimar custo (valores aproximados para Command R+)
        tokens_used = result.get("meta", {}).get("billed_units", {}).get("output_tokens", 0)
        cost_per_token = 0.000001  # $1.00 por 1M tokens
        estimated_cost = tokens_used * cost_per_token
        
        return LLMResponse(
            text=text.strip(),
            model=self.model_name,
            tokens_used=tokens_used,
            processing_time=processing_time,
            cost=estimated_cost,
            metadata={
                "meta": result.get("meta", {}),
                "finish_reason": generation.get("finish_reason"),
                "provider": "cohere"
            }
        )
