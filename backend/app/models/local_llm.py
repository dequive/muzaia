# -*- coding: utf-8 -*-
"""
Implementação de clientes para modelos LLM locais (Ollama).
"""
import json
from typing import Optional, Dict, Any, AsyncGenerator

import aiohttp

from app.models.base_llm import BaseLLM
from app.core.protocols import LLMStreamChunk
from app.schemas import LLMResponse, GenerationParams
from app.core.exceptions import LLMConnectionError, LLMTimeoutError, LLMInvalidResponseError


class OllamaLLM(BaseLLM):
    """
    Cliente para modelos Ollama (local).
    
    Características:
    - Conexão com servidor Ollama local
    - Suporte completo a streaming
    - Health checks automáticos
    - Pull automático de modelos
    """

    def __init__(
        self,
        model_name: str,
        session: Optional[aiohttp.ClientSession] = None,
        base_url: str = "http://localhost:11434",
        **kwargs
    ):
        """
        Inicializa cliente Ollama.
        
        Args:
            model_name: Nome do modelo Ollama
            session: Sessão HTTP opcional
            base_url: URL base do servidor Ollama
            **kwargs: Argumentos adicionais
        """
        super().__init__(model_name, session, **kwargs)
        self.base_url = base_url.rstrip('/')
        
        # URLs específicas do Ollama
        self.generate_url = f"{self.base_url}/api/generate"
        self.chat_url = f"{self.base_url}/api/chat"
        self.tags_url = f"{self.base_url}/api/tags"
        self.pull_url = f"{self.base_url}/api/pull"
        self.show_url = f"{self.base_url}/api/show"

    @property
    def provider(self) -> str:
        """Nome do provedor."""
        return "ollama"

    async def _generate_impl(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """Implementação da geração para Ollama."""
        
        # Construir prompt completo
        full_prompt = self._build_full_prompt(prompt, context, system_prompt)
        
        # Preparar payload
        payload = {
            "model": self.model_name,
            "prompt": full_prompt,
            "stream": False
        }
        
        # Adicionar parâmetros se fornecidos
        if params:
            if params.temperature is not None:
                payload["options"] = payload.get("options", {})
                payload["options"]["temperature"] = params.temperature
            if params.max_tokens is not None:
                payload["options"] = payload.get("options", {})
                payload["options"]["num_predict"] = params.max_tokens
            if params.top_p is not None:
                payload["options"] = payload.get("options", {})
                payload["options"]["top_p"] = params.top_p

        try:
            async with self._session.post(
                self.generate_url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self._timeout)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    raise LLMConnectionError(
                        f"Ollama retornou status {response.status}: {error_text}",
                        self.model_name
                    )
                
                result = await response.json()
                
                # Extrair informações da resposta
                response_text = result.get("response", "")
                
                if not response_text:
                    raise LLMInvalidResponseError(
                        "Resposta vazia do Ollama",
                        self.model_name
                    )
                
                # Estimar tokens (Ollama não retorna sempre)
                tokens_used = result.get("eval_count", len(response_text.split()))
                
                return LLMResponse(
                    text=response_text,
                    model=self.model_name,
                    tokens_used=tokens_used,
                    processing_time=result.get("total_duration", 0) / 1e9,  # nanoseconds to seconds
                    cost=0.0,  # Ollama é gratuito
                    confidence=0.8,  # Confiança padrão para Ollama
                    metadata={
                        "context": result.get("context", []),
                        "done": result.get("done", True),
                        "load_duration": result.get("load_duration", 0),
                        "prompt_eval_count": result.get("prompt_eval_count", 0),
                        "prompt_eval_duration": result.get("prompt_eval_duration", 0),
                        "eval_count": result.get("eval_count", 0),
                        "eval_duration": result.get("eval_duration", 0)
                    }
                )
                
        except aiohttp.ClientTimeout:
            raise LLMTimeoutError(f"Timeout na requisição para Ollama", self.model_name)
        except aiohttp.ClientError as e:
            raise LLMConnectionError(f"Erro de conexão com Ollama: {e}", self.model_name)
        except json.JSONDecodeError as e:
            raise LLMInvalidResponseError(f"Resposta JSON inválida do Ollama: {e}", self.model_name)

    async def _stream_generate_impl(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        """Implementação do streaming para Ollama."""
        
        # Construir prompt completo
        full_prompt = self._build_full_prompt(prompt, context, system_prompt)
        
        # Preparar payload
        payload = {
            "model": self.model_name,
            "prompt": full_prompt,
            "stream": True
        }
        
        # Adicionar parâmetros
        if params:
            options = {}
            if params.temperature is not None:
                options["temperature"] = params.temperature
            if params.max_tokens is not None:
                options["num_predict"] = params.max_tokens
            if params.top_p is not None:
                options["top_p"] = params.top_p
            
            if options:
                payload["options"] = options

        try:
            async with self._session.post(
                self.generate_url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self._timeout * 2)  # Mais tempo para streaming
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    yield {
                        "content": "",
                        "is_final": True,
                        "error": f"Ollama status {response.status}: {error_text}"
                    }
                    return
                
                full_response = ""
                async for line in response.content:
                    if not line:
                        continue
                    
                    try:
                        # Decodificar linha JSON
                        chunk_data = json.loads(line.decode().strip())
                        
                        content = chunk_data.get("response", "")
                        is_done = chunk_data.get("done", False)
                        
                        if content:
                            full_response += content
                        
                        yield {
                            "content": content,
                            "is_final": is_done,
                            "metadata": {
                                "done": is_done,
                                "context": chunk_data.get("context", []),
                                "total_duration": chunk_data.get("total_duration"),
                                "eval_count": chunk_data.get("eval_count")
                            }
                        }
                        
                        if is_done:
                            break
                            
                    except json.JSONDecodeError as e:
                        self.log.warning(f"Erro ao decodificar chunk JSON: {e}")
                        continue
                
        except aiohttp.ClientTimeout:
            yield {
                "content": "",
                "is_final": True,
                "error": "Timeout no streaming do Ollama"
            }
        except Exception as e:
            yield {
                "content": "",
                "is_final": True,
                "error": f"Erro no streaming: {str(e)}"
            }

    async def _health_check_impl(self) -> bool:
        """Implementação do health check para Ollama."""
        try:
            # Verificar se servidor Ollama está respondendo
            async with self._session.get(
                self.tags_url,
                timeout=aiohttp.ClientTimeout(total=5.0)
            ) as response:
                
                if response.status != 200:
                    return False
                
                # Verificar se nosso modelo está disponível
                data = await response.json()
                models = data.get("models", [])
                
                for model in models:
                    if model.get("name") == self.model_name:
                        return True
                
                # Se modelo não encontrado, tentar pull
                self.log.info(f"Modelo {self.model_name} não encontrado, tentando pull...")
                return await self._try_pull_model()
                
        except Exception as e:
            self.log.error(f"Erro no health check: {e}")
            return False

    async def _get_model_info_impl(self) -> Dict[str, Any]:
        """Implementação para obter informações do modelo Ollama."""
        try:
            # Obter informações detalhadas do modelo
            async with self._session.post(
                self.show_url,
                json={"name": self.model_name},
                timeout=aiohttp.ClientTimeout(total=10.0)
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    return {
                        "available": True,
                        "details": data.get("details", {}),
                        "modelfile": data.get("modelfile", ""),
                        "parameters": data.get("parameters", {}),
                        "template": data.get("template", ""),
                        "system": data.get("system", ""),
                        "size": data.get("size", 0)
                    }
                else:
                    return {"available": False, "error": f"Status {response.status}"}
                    
        except Exception as e:
            return {"available": False, "error": str(e)}

    async def _try_pull_model(self) -> bool:
        """Tenta fazer pull do modelo se não estiver disponível."""
        try:
            self.log.info(f"Fazendo pull do modelo {self.model_name}...")
            
            async with self._session.post(
                self.pull_url,
                json={"name": self.model_name},
                timeout=aiohttp.ClientTimeout(total=300.0)  # 5 minutos para pull
            ) as response:
                
                if response.status == 200:
                    # Consumir stream de pull
                    async for line in response.content:
                        try:
                            chunk = json.loads(line.decode().strip())
                            if chunk.get("status") == "success":
                                self.log.info(f"Modelo {self.model_name} baixado com sucesso")
                                return True
                        except json.JSONDecodeError:
                            continue
                
                return False
                
        except Exception as e:
            self.log.error(f"Erro ao fazer pull do modelo: {e}")
            return False

    def _build_full_prompt(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None
    ) -> str:
        """Constrói prompt completo para Ollama."""
        parts = []
        
        if system_prompt:
            parts.append(f"System: {system_prompt}")
        
        if context:
            parts.append(f"Context: {context}")
        
        parts.append(f"User: {prompt}")
        parts.append("Assistant:")
        
        return "\n\n".join(parts)
