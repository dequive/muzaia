
# -*- coding: utf-8 -*-
"""
Cliente para Anthropic Claude 3.5 Sonnet.

Implementa comunicação com a API da Anthropic para o modelo Claude 3.5 Sonnet,
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


class ClaudeLLM(BaseLLM):
    """
    Cliente para Anthropic Claude 3.5 Sonnet.
    
    Características:
    - Suporte completo à API da Anthropic
    - Streaming de respostas
    - Retry automático com backoff
    - Métricas detalhadas
    - Error handling robusto
    """

    def __init__(
        self,
        model_name: str = "claude-3-5-sonnet-20241022",
        api_key: Optional[str] = None,
        base_url: str = "https://api.anthropic.com",
        session: Optional[aiohttp.ClientSession] = None,
        **kwargs
    ):
        """
        Inicializa cliente Claude.
        
        Args:
            model_name: Nome do modelo Claude
            api_key: Chave da API Anthropic
            base_url: URL base da API
            session: Sessão HTTP externa
            **kwargs: Argumentos adicionais
        """
        super().__init__(model_name, session, **kwargs)
        
        self._api_key = api_key or settings.llm.anthropic_api_key
        self._base_url = base_url.rstrip('/')
        self._anthropic_version = "2023-06-01"
        
        if not self._api_key:
            raise ValueError("API key da Anthropic é obrigatória")
        
        self.log.info(f"Cliente Claude inicializado para modelo '{model_name}'")

    @property
    def provider(self) -> str:
        """Nome do provedor."""
        return "anthropic"

    def _get_headers(self) -> Dict[str, str]:
        """Constrói headers para requisições."""
        return {
            "Content-Type": "application/json",
            "x-api-key": self._api_key,
            "anthropic-version": self._anthropic_version,
            "User-Agent": f"Mozaia/1.0.0 (Claude Client)"
        }

    def _build_messages(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None
    ) -> tuple[str, list]:
        """
        Constrói mensagens no formato Claude.
        
        Returns:
            Tuple com (system_message, messages_array)
        """
        # System message (separado no Claude)
        system_message = system_prompt or "Você é um assistente jurídico especializado."
        
        # Construir prompt completo
        full_prompt = prompt
        if context:
            full_prompt = f"Contexto: {context}\n\nPergunta: {prompt}"
        
        # Messages array
        messages = [
            {
                "role": "user",
                "content": full_prompt
            }
        ]
        
        return system_message, messages

    def _build_request_data(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Constrói dados da requisição."""
        system_message, messages = self._build_messages(prompt, context, system_prompt)
        
        # Parâmetros padrão
        data = {
            "model": self.model_name,
            "messages": messages,
            "system": system_message,
            "max_tokens": 4096,
            "stream": stream
        }
        
        # Aplicar parâmetros customizados
        if params:
            if params.max_tokens:
                data["max_tokens"] = min(params.max_tokens, 4096)
            if params.temperature is not None:
                data["temperature"] = max(0.0, min(1.0, params.temperature))
            if params.top_p is not None:
                data["top_p"] = max(0.0, min(1.0, params.top_p))
        
        return data

    async def _generate_impl(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """Implementação da geração Claude."""
        
        data = self._build_request_data(prompt, context, system_prompt, params, stream=False)
        url = f"{self._base_url}/v1/messages"
        
        try:
            async with self._session.post(
                url,
                headers=self._get_headers(),
                json=data,
                timeout=aiohttp.ClientTimeout(total=self._timeout)
            ) as response:
                
                if response.status == 429:
                    raise LLMRateLimitError("Rate limit excedido", self.model_name)
                elif response.status == 401:
                    raise LLMConnectionError("API key inválida", self.model_name)
                elif response.status not in (200, 201):
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Erro HTTP {response.status}: {error_text}", 
                        self.model_name
                    )
                
                result = await response.json()
                
                # Extrair resposta
                content = ""
                if result.get("content") and len(result["content"]) > 0:
                    content = result["content"][0].get("text", "")
                
                # Calcular tokens e custo estimado
                tokens_used = result.get("usage", {}).get("output_tokens", 0)
                input_tokens = result.get("usage", {}).get("input_tokens", 0)
                total_tokens = tokens_used + input_tokens
                
                # Custo estimado (Claude 3.5 Sonnet: $3/1M input, $15/1M output)
                cost = (input_tokens * 0.000003) + (tokens_used * 0.000015)
                
                return LLMResponse(
                    content=content,
                    model=self.model_name,
                    provider=self.provider,
                    tokens_used=total_tokens,
                    cost=cost,
                    metadata={
                        "input_tokens": input_tokens,
                        "output_tokens": tokens_used,
                        "stop_reason": result.get("stop_reason"),
                        "anthropic_id": result.get("id")
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
        """Implementação do streaming Claude."""
        
        data = self._build_request_data(prompt, context, system_prompt, params, stream=True)
        url = f"{self._base_url}/v1/messages"
        
        try:
            async with self._session.post(
                url,
                headers=self._get_headers(),
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
                input_tokens = 0
                output_tokens = 0
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    
                    if not line or not line.startswith('data: '):
                        continue
                    
                    # Remove prefixo 'data: '
                    json_str = line[6:]
                    
                    # Event stream ended
                    if json_str == '[DONE]':
                        break
                    
                    try:
                        event_data = json.loads(json_str)
                        event_type = event_data.get("type")
                        
                        if event_type == "message_start":
                            # Início da mensagem
                            usage = event_data.get("message", {}).get("usage", {})
                            input_tokens = usage.get("input_tokens", 0)
                            
                        elif event_type == "content_block_delta":
                            # Chunk de conteúdo
                            delta = event_data.get("delta", {})
                            if delta.get("type") == "text_delta":
                                chunk_content = delta.get("text", "")
                                accumulated_content += chunk_content
                                
                                yield {
                                    "content": chunk_content,
                                    "is_final": False,
                                    "model": self.model_name,
                                    "metadata": {
                                        "accumulated_length": len(accumulated_content)
                                    }
                                }
                        
                        elif event_type == "message_delta":
                            # Delta da mensagem (inclui uso final)
                            usage = event_data.get("usage", {})
                            output_tokens = usage.get("output_tokens", 0)
                            
                        elif event_type == "message_stop":
                            # Fim da mensagem
                            total_tokens = input_tokens + output_tokens
                            cost = (input_tokens * 0.000003) + (output_tokens * 0.000015)
                            
                            yield {
                                "content": "",
                                "is_final": True,
                                "model": self.model_name,
                                "metadata": {
                                    "total_content": accumulated_content,
                                    "input_tokens": input_tokens,
                                    "output_tokens": output_tokens,
                                    "total_tokens": total_tokens,
                                    "cost": cost
                                }
                            }
                            
                    except json.JSONDecodeError:
                        # Ignorar linhas malformadas
                        continue
                        
        except aiohttp.ClientTimeout:
            raise LLMTimeoutError(f"Timeout no streaming para {self.model_name}")
        except aiohttp.ClientError as e:
            raise LLMConnectionError(f"Erro de conexão no streaming: {str(e)}", self.model_name)

    async def _health_check_impl(self) -> bool:
        """Health check específico do Claude."""
        try:
            # Teste simples com prompt mínimo
            data = {
                "model": self.model_name,
                "messages": [{"role": "user", "content": "Hi"}],
                "system": "Respond with just 'OK'",
                "max_tokens": 10
            }
            
            url = f"{self._base_url}/v1/messages"
            
            async with self._session.post(
                url,
                headers=self._get_headers(),
                json=data,
                timeout=aiohttp.ClientTimeout(total=10.0)
            ) as response:
                
                return response.status == 200
                
        except Exception:
            return False

    async def _get_model_info_impl(self) -> Dict[str, Any]:
        """Obtém informações do modelo Claude."""
        return {
            "model_name": self.model_name,
            "provider": self.provider,
            "type": "chat",
            "max_tokens": 4096,
            "supports_streaming": True,
            "supports_function_calling": False,
            "context_window": 200000,  # Claude 3.5 Sonnet context window
            "api_version": self._anthropic_version,
            "pricing": {
                "input_tokens_per_dollar": 333333,  # $3/1M tokens
                "output_tokens_per_dollar": 66667   # $15/1M tokens
            }
        }
