
# -*- coding: utf-8 -*-
"""
Cliente para Google Gemini Pro 1.5.

Implementa comunicação com a API do Google Gemini AI,
incluindo suporte a streaming e error handling robusto.
"""

import json
import time
from typing import Dict, Any, Optional, AsyncGenerator

import aiohttp

from app.models.base_llm import BaseLLM
from app.schemas import LLMResponse, GenerationParams
from app.core.protocols import LLMStreamChunk
from app.core.exceptions import LLMConnectionError, LLMTimeoutError, LLMRateLimitError
from app.core.config import settings


class GeminiLLM(BaseLLM):
    """
    Cliente para Google Gemini Pro 1.5.
    
    Características:
    - Suporte completo à API do Google Gemini
    - Streaming de respostas
    - Retry automático com backoff
    - Métricas detalhadas
    - Error handling robusto
    """

    def __init__(
        self,
        model_name: str = "gemini-1.5-pro-latest",
        api_key: Optional[str] = None,
        base_url: str = "https://generativelanguage.googleapis.com",
        session: Optional[aiohttp.ClientSession] = None,
        **kwargs
    ):
        """
        Inicializa cliente Gemini.
        
        Args:
            model_name: Nome do modelo Gemini
            api_key: Chave da API Google
            base_url: URL base da API
            session: Sessão HTTP externa
            **kwargs: Argumentos adicionais
        """
        super().__init__(model_name, session, **kwargs)
        
        self._api_key = api_key or settings.llm.google_api_key
        self._base_url = base_url.rstrip('/')
        
        if not self._api_key:
            raise ValueError("API key do Google é obrigatória")
        
        self.log.info(f"Cliente Gemini inicializado para modelo '{model_name}'")

    @property
    def provider(self) -> str:
        """Nome do provedor."""
        return "google"

    def _get_url(self, endpoint: str, stream: bool = False) -> str:
        """Constrói URL para requisições."""
        action = "streamGenerateContent" if stream else "generateContent"
        return f"{self._base_url}/v1beta/models/{self.model_name}:{action}?key={self._api_key}"

    def _build_contents(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None
    ) -> list:
        """Constrói array de conteúdos no formato Gemini."""
        
        # Construir prompt completo
        full_prompt = prompt
        if context:
            full_prompt = f"Contexto: {context}\n\nPergunta: {prompt}"
        
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{full_prompt}"
        
        return [
            {
                "parts": [
                    {
                        "text": full_prompt
                    }
                ]
            }
        ]

    def _build_request_data(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> Dict[str, Any]:
        """Constrói dados da requisição."""
        
        contents = self._build_contents(prompt, context, system_prompt)
        
        # Configurações de geração
        generation_config = {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "topP": 0.95,
            "topK": 40
        }
        
        # Aplicar parâmetros customizados
        if params:
            if params.max_tokens:
                generation_config["maxOutputTokens"] = min(params.max_tokens, 8192)
            if params.temperature is not None:
                generation_config["temperature"] = max(0.0, min(2.0, params.temperature))
            if params.top_p is not None:
                generation_config["topP"] = max(0.0, min(1.0, params.top_p))
            if params.top_k is not None:
                generation_config["topK"] = max(1, min(40, params.top_k))
        
        # Configurações de segurança (permissivas para uso jurídico)
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_ONLY_HIGH"
            }
        ]
        
        return {
            "contents": contents,
            "generationConfig": generation_config,
            "safetySettings": safety_settings
        }

    async def _generate_impl(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """Implementação da geração Gemini."""
        
        data = self._build_request_data(prompt, context, system_prompt, params)
        url = self._get_url("generateContent", stream=False)
        
        try:
            async with self._session.post(
                url,
                headers={"Content-Type": "application/json"},
                json=data,
                timeout=aiohttp.ClientTimeout(total=self._timeout)
            ) as response:
                
                if response.status == 429:
                    raise LLMRateLimitError("Rate limit excedido", self.model_name)
                elif response.status == 403:
                    raise LLMConnectionError("API key inválida ou permissões insuficientes", self.model_name)
                elif response.status not in (200, 201):
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Erro HTTP {response.status}: {error_text}",
                        self.model_name
                    )
                
                result = await response.json()
                
                # Verificar se há candidatos
                candidates = result.get("candidates", [])
                if not candidates:
                    raise LLMConnectionError("Nenhuma resposta gerada", self.model_name)
                
                candidate = candidates[0]
                
                # Verificar se foi bloqueado por segurança
                finish_reason = candidate.get("finishReason")
                if finish_reason == "SAFETY":
                    raise LLMConnectionError("Resposta bloqueada por filtros de segurança", self.model_name)
                
                # Extrair conteúdo
                content = ""
                parts = candidate.get("content", {}).get("parts", [])
                if parts:
                    content = parts[0].get("text", "")
                
                # Calcular tokens e custo estimado
                usage = result.get("usageMetadata", {})
                prompt_tokens = usage.get("promptTokenCount", 0)
                completion_tokens = usage.get("candidatesTokenCount", 0)
                total_tokens = usage.get("totalTokenCount", prompt_tokens + completion_tokens)
                
                # Custo estimado (Gemini Pro 1.5: $1.25/1M input, $5/1M output)
                cost = (prompt_tokens * 0.00000125) + (completion_tokens * 0.000005)
                
                return LLMResponse(
                    content=content,
                    model=self.model_name,
                    provider=self.provider,
                    tokens_used=total_tokens,
                    cost=cost,
                    metadata={
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "finish_reason": finish_reason,
                        "safety_ratings": candidate.get("safetyRatings", [])
                    }
                )
                
        except aiohttp.ClientTimeout:
            raise LLMTimeoutError(f"Timeout na requisição para {self.model_name}")
        except aiohttp.ClientError as e:
            raise LLMConnectionError(f"Erro de conexão: {str(e)}", self.model_name)

    async def _stream_generate_impl(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        """Implementação do streaming Gemini."""
        
        data = self._build_request_data(prompt, context, system_prompt, params)
        url = self._get_url("streamGenerateContent", stream=True)
        
        try:
            async with self._session.post(
                url,
                headers={"Content-Type": "application/json"},
                json=data,
                timeout=aiohttp.ClientTimeout(total=self._timeout)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Erro HTTP {response.status}: {error_text}",
                        self.model_name
                    )
                
                accumulated_content = ""
                total_prompt_tokens = 0
                total_completion_tokens = 0
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    
                    if not line:
                        continue
                    
                    try:
                        # Gemini retorna JSON completo em cada linha
                        chunk_data = json.loads(line)
                        
                        candidates = chunk_data.get("candidates", [])
                        if not candidates:
                            continue
                        
                        candidate = candidates[0]
                        
                        # Verificar finish reason
                        finish_reason = candidate.get("finishReason")
                        if finish_reason == "SAFETY":
                            yield {
                                "content": "",
                                "is_final": True,
                                "error": "Resposta bloqueada por filtros de segurança",
                                "model": self.model_name
                            }
                            return
                        
                        # Extrair conteúdo
                        parts = candidate.get("content", {}).get("parts", [])
                        if parts:
                            chunk_content = parts[0].get("text", "")
                            accumulated_content += chunk_content
                            
                            # Verificar se é chunk final
                            is_final = finish_reason in ("STOP", "MAX_TOKENS")
                            
                            # Extrair uso de tokens (quando disponível)
                            usage = chunk_data.get("usageMetadata", {})
                            if usage:
                                total_prompt_tokens = usage.get("promptTokenCount", 0)
                                total_completion_tokens = usage.get("candidatesTokenCount", 0)
                            
                            chunk_metadata = {
                                "accumulated_length": len(accumulated_content),
                                "finish_reason": finish_reason
                            }
                            
                            if is_final and usage:
                                total_tokens = usage.get("totalTokenCount", total_prompt_tokens + total_completion_tokens)
                                cost = (total_prompt_tokens * 0.00000125) + (total_completion_tokens * 0.000005)
                                
                                chunk_metadata.update({
                                    "total_content": accumulated_content,
                                    "prompt_tokens": total_prompt_tokens,
                                    "completion_tokens": total_completion_tokens,
                                    "total_tokens": total_tokens,
                                    "cost": cost
                                })
                            
                            yield {
                                "content": chunk_content,
                                "is_final": is_final,
                                "model": self.model_name,
                                "metadata": chunk_metadata
                            }
                            
                            if is_final:
                                break
                                
                    except json.JSONDecodeError:
                        # Ignorar linhas malformadas
                        continue
                        
        except aiohttp.ClientTimeout:
            raise LLMTimeoutError(f"Timeout no streaming para {self.model_name}")
        except aiohttp.ClientError as e:
            raise LLMConnectionError(f"Erro de conexão no streaming: {str(e)}", self.model_name)

    async def _health_check_impl(self) -> bool:
        """Health check específico do Gemini."""
        try:
            # Teste simples com prompt mínimo
            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Hi"
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "maxOutputTokens": 10
                }
            }
            
            url = self._get_url("generateContent", stream=False)
            
            async with self._session.post(
                url,
                headers={"Content-Type": "application/json"},
                json=data,
                timeout=aiohttp.ClientTimeout(total=10.0)
            ) as response:
                
                return response.status == 200
                
        except Exception:
            return False

    async def _get_model_info_impl(self) -> Dict[str, Any]:
        """Obtém informações do modelo Gemini."""
        return {
            "model_name": self.model_name,
            "provider": self.provider,
            "type": "chat",
            "max_tokens": 8192,
            "supports_streaming": True,
            "supports_function_calling": True,
            "context_window": 1000000,  # Gemini 1.5 Pro context window
            "supports_multimodal": True,
            "pricing": {
                "input_tokens_per_dollar": 800000,   # $1.25/1M tokens
                "output_tokens_per_dollar": 200000   # $5/1M tokens
            }
        }
