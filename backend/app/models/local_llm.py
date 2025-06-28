backend/app/models/local_llm.py
import asyncio
import aiohttp
import logging
from typing import Dict, Any, Optional, Union, List, AsyncGenerator
from pydantic import BaseModel, Field, validator, root_validator
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import datetime, timedelta
import json
from tokenizers import Tokenizer
from collections import deque
import time

# Configuração de logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)

# --- Exceções Personalizadas ---
class APIError(Exception):
    """Exceção para erros de API com status HTTP diferente de 200"""
    pass

class LLMError(Exception):
    """Exceção para erros internos do LLM"""
    pass

class CircuitBreakerError(Exception):
    """Exceção para quando o circuit breaker está aberto"""
    pass

class ModelNotFoundError(Exception):
    """Exceção para modelo não encontrado"""
    pass

class RateLimitExceeded(Exception):
    """Exceção para quando o rate limit é excedido"""
    def __init__(self, reset_time: float):
        self.reset_time = reset_time
        super().__init__(f"Rate limit exceeded. Resets at {datetime.fromtimestamp(reset_time)}")

# --- Modelos de Dados ---
class GenerationParams(BaseModel):
    temperature: float = Field(0.3, ge=0, le=2.0)
    top_p: float = Field(0.9, ge=0, le=1)
    top_k: int = Field(40, ge=1, le=100)
    max_tokens: int = Field(1000, gt=0, le=4096)
    timeout: int = Field(60, gt=0, le=300)
    repeat_penalty: float = Field(1.1, ge=0.1, le=2.0)
    seed: Optional[int] = Field(None)
    frequency_penalty: float = Field(0.0, ge=0, le=2.0)
    presence_penalty: float = Field(0.0, ge=0, le=2.0)

    @validator('temperature')
    def validate_temperature(cls, v):
        if v == 0:
            logger.warning("Temperature=0 pode resultar em respostas repetitivas")
        elif v > 1.5:
            logger.warning("Temperature>1.5 pode gerar respostas incoerentes")
        return v

class ChatMessage(BaseModel):
    role: str = Field(..., regex="^(system|user|assistant)$")
    content: str = Field(..., min_length=1)
    timestamp: datetime = Field(default_factory=datetime.now)
    tokens: Optional[int] = Field(None, description="Contagem de tokens da mensagem")

class ModelInfo(BaseModel):
    name: str
    size: int
    modified_at: datetime
    digest: str
    details: Dict[str, Any] = Field(default_factory=dict)
    tokenizer_config: Optional[Dict] = Field(None)

class PromptTemplate(BaseModel):
    name: str
    template: str
    variables: List[str]
    description: Optional[str] = None
    system_prompt: Optional[str] = None

    @root_validator
    def validate_variables(cls, values):
        template = values.get('template', '')
        variables = values.get('variables', [])
        
        for var in variables:
            if f"{{{var}}}" not in template:
                raise ValueError(f"Variable {var} not found in template")
        
        return values

# --- Cliente Ollama Aprimorado ---
class OllamaLLM:
    def __init__(
        self,
        model_name: str,
        base_url: str = "http://localhost:11434",
        default_params: Optional[GenerationParams] = None,
        max_retries: int = 3,
        circuit_breaker_timeout: int = 60,
        circuit_breaker_failure_threshold: int = 5,
        rate_limit: int = 10,  # 10 requests
        rate_period: int = 60,  # per minute
        tokenizer_path: Optional[str] = None
    ):
        self.model_name = model_name
        self.base_url = base_url.rstrip('/')
        self.default_params = default_params or GenerationParams()
        self.max_retries = max_retries
        self.circuit_breaker_timeout = circuit_breaker_timeout
        self.circuit_breaker_failure_threshold = circuit_breaker_failure_threshold
        
        # Rate limiting
        self.rate_limit = rate_limit
        self.rate_period = rate_period
        self.request_times = deque(maxlen=rate_limit)
        
        # Tokenizer
        self.tokenizer = None
        if tokenizer_path:
            try:
                self.tokenizer = Tokenizer.from_file(tokenizer_path)
            except Exception as e:
                logger.warning(f"Failed to load tokenizer: {e}")
        
        # Circuit breaker state
        self._circuit_open = False
        self._failure_count = 0
        self._last_failure_time = None
        
        # Conversation and templates
        self._conversation_history = []
        self._prompt_templates = {
            "legal_question": PromptTemplate(
                name="legal_question",
                template="Contexto: {context}\nPergunta: {question}",
                variables=["context", "question"],
                system_prompt="Você é um assistente jurídico especializado em legislação moçambicana."
            )
        }
        
        # Session management
        self.session = None
        self._session_lock = asyncio.Lock()

    async def __aenter__(self):
        async with self._session_lock:
            if self.session is None or self.session.closed:
                connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)
                self.session = aiohttp.ClientSession(
                    connector=connector,
                    timeout=aiohttp.ClientTimeout(total=self.default_params.timeout),
                    headers={"Content-Type": "application/json"}
                )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        async with self._session_lock:
            if self.session and not self.session.closed:
                await self.session.close()
                self.session = None

    # --- Rate Limiting ---
    async def _check_rate_limit(self):
        now = time.time()
        
        # Remove old requests
        while self.request_times and now - self.request_times[0] > self.rate_period:
            self.request_times.popleft()
            
        if len(self.request_times) >= self.rate_limit:
            reset_time = self.request_times[0] + self.rate_period
            raise RateLimitExceeded(reset_time)
            
        self.request_times.append(now)

    # --- Circuit Breaker ---
    def _check_circuit_breaker(self):
        if self._circuit_open:
            if (self._last_failure_time and 
                datetime.now() - self._last_failure_time > timedelta(seconds=self.circuit_breaker_timeout)):
                logger.info("Circuit breaker timeout expired. Trying to close.")
                self._circuit_open = False
                self._failure_count = 0
            else:
                raise CircuitBreakerError("Circuit breaker is open - requests suspended")

    def _record_success(self):
        self._failure_count = 0
        if self._circuit_open:
            logger.info("Circuit breaker closed after successful request")
            self._circuit_open = False

    def _record_failure(self):
        self._failure_count += 1
        self._last_failure_time = datetime.now()
        
        if self._failure_count >= self.circuit_breaker_failure_threshold:
            logger.warning(f"Circuit breaker opened after {self._failure_count} failures")
            self._circuit_open = True

    # --- Token Counting ---
    def count_tokens(self, text: str) -> int:
        if not self.tokenizer:
            logger.warning("No tokenizer loaded - using approximate token count")
            return len(text.split())  # Fallback approximation
            
        return len(self.tokenizer.encode(text).tokens)

    # --- Request Handling ---
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError)),
        before_sleep=lambda retry_state: logger.warning(
            f"Retry {retry_state.attempt_number}/3 for {retry_state.fn.__name__}. "
            f"Next attempt in {retry_state.next_action.sleep_amount:.1f}s")
    )
    async def _make_request(self, endpoint: str, payload: Dict[str, Any], stream: bool = False) -> Union[Dict[str, Any], AsyncGenerator[Dict[str, Any], None]]:
        """Enhanced request handler with streaming support"""
        self._check_circuit_breaker()
        await self._check_rate_limit()

        async with self._session_lock:
            if self.session is None:
                await self.__aenter__()

        try:
            async with self.session.post(
                f"{self.base_url}/{endpoint}",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.default_params.timeout)
            ) as resp:
                
                if resp.status == 404:
                    self._record_failure()
                    raise ModelNotFoundError(f"Model '{self.model_name}' not found")
                elif resp.status != 200:
                    self._record_failure()
                    error_text = await resp.text()
                    raise APIError(f"API error: HTTP {resp.status} - {error_text}")

                if stream:
                    self._record_success()
                    async for line in resp.content:
                        if line:
                            yield json.loads(line.decode('utf-8'))
                else:
                    result = await resp.json()
                    self._record_success()
                    return result

        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            self._record_failure()
            logger.error(f"HTTP/Network error: {str(e)}")
            raise
        except Exception as e:
            self._record_failure()
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            raise LLMError(f"LLM processing error: {str(e)}")

    # --- Streaming Generation ---
    async def stream_generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: str = "",
        **generation_params
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming text generation"""
        if not prompt:
            raise ValueError("Prompt cannot be empty")

        params = self.default_params.copy(update=generation_params)
        payload = {
            "model": self.model_name,
            "prompt": self._format_prompt(prompt, context, system_prompt),
            "stream": True,
            "options": {
                "temperature": params.temperature,
                "top_p": params.top_p,
                "top_k": params.top_k,
                "num_predict": params.max_tokens,
                "repeat_penalty": params.repeat_penalty,
                "seed": params.seed,
                "frequency_penalty": params.frequency_penalty,
                "presence_penalty": params.presence_penalty
            }
        }

        try:
            async for chunk in self._make_request("api/generate", payload, stream=True):
                yield {
                    "text": chunk.get("response", ""),
                    "done": chunk.get("done", False),
                    "model": self.model_name,
                    "tokens_used": chunk.get("eval_count", 0)
                }
        except Exception as e:
            logger.error(f"Stream generation failed: {str(e)}")
            raise

    # --- Prompt Templates ---
    def add_template(self, template: PromptTemplate):
        """Add a new prompt template"""
        self._prompt_templates[template.name] = template

    def get_template(self, name: str) -> PromptTemplate:
        """Get a prompt template by name"""
        if name not in self._prompt_templates:
            raise ValueError(f"Template '{name}' not found")
        return self._prompt_templates[name]

    def apply_template(
        self,
        template_name: str,
        variables: Dict[str, str],
        **generation_params
    ) -> Dict[str, Any]:
        """Apply a template with variables"""
        template = self.get_template(template_name)
        
        # Validate all variables are provided
        missing_vars = [var for var in template.variables if var not in variables]
        if missing_vars:
            raise ValueError(f"Missing variables for template: {missing_vars}")
        
        # Format the prompt
        formatted_prompt = template.template.format(**variables)
        
        return {
            "prompt": formatted_prompt,
            "system_prompt": template.system_prompt,
            "generation_params": generation_params
        }

    # --- Enhanced Chat ---
    async def chat(
        self,
        message: str,
        role: str = "user",
        clear_history: bool = False,
        template_name: Optional[str] = None,
        template_vars: Optional[Dict[str, str]] = None,
        **generation_params
    ) -> Dict[str, Any]:
        """Enhanced chat with template support"""
        if clear_history:
            self._conversation_history.clear()
            
        # Apply template if specified
        if template_name:
            if not template_vars:
                template_vars = {}
            template_result = self.apply_template(template_name, template_vars)
            message = template_result["prompt"]
            if template_result["system_prompt"]:
                generation_params["system_prompt"] = template_result["system_prompt"]
        
        # Create and count tokens for the message
        user_msg = ChatMessage(
            role=role,
            content=message,
            tokens=self.count_tokens(message)
        )
        self._conversation_history.append(user_msg)
        
        # Prepare payload
        messages_payload = [
            {"role": msg.role, "content": msg.content} 
            for msg in self._conversation_history
        ]
        
        params = self.default_params.copy(update=generation_params)
        payload = {
            "model": self.model_name,
            "messages": messages_payload,
            "stream": False,
            "options": {
                "temperature": params.temperature,
                "top_p": params.top_p,
                "top_k": params.top_k,
                "num_predict": params.max_tokens,
                "repeat_penalty": params.repeat_penalty,
                "seed": params.seed
            }
        }

        try:
            start_time = time.time()
            result = await self._make_request("api/chat", payload)
            processing_time = time.time() - start_time
            
            # Create and count tokens for the assistant message
            assistant_response = result.get("message", {}).get("content", "")
            assistant_msg = ChatMessage(
                role="assistant",
                content=assistant_response,
                tokens=self.count_tokens(assistant_response)
            )
            self._conversation_history.append(assistant_msg)
            
            return {
                "text": assistant_response,
                "model": self.model_name,
                "tokens_used": result.get("eval_count", 0),
                "processing_time": processing_time,
                "conversation_length": len(self._conversation_history),
                "conversation_tokens": sum(msg.tokens for msg in self._conversation_history if msg.tokens),
                "success": True,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Chat failed: {str(e)}")
            return {
                "text": f"Error: {str(e)}",
                "model": self.model_name,
                "error": str(e),
                "success": False,
                "tokens_used": 0,
                "processing_time": 0.0
            }

    # --- Health Check ---
    async def health_check(self) -> Dict[str, Any]:
        """Enhanced health check with tokenizer status"""
        health_info = {
            "status": "healthy",
            "model": self.model_name,
            "circuit_breaker": {
                "open": self._circuit_open,
                "failure_count": self._failure_count,
                "last_failure": self._last_failure_time.isoformat() if self._last_failure_time else None
            },
            "rate_limiting": {
                "limit": self.rate_limit,
                "period": self.rate_period,
                "current_requests": len(self.request_times)
            },
            "tokenizer": "loaded" if self.tokenizer else "not_loaded",
            "templates": list(self._prompt_templates.keys())
        }

        try:
            models = await self.list_models()
            health_info["models_available"] = len(models)
            health_info["model_exists"] = any(m.name == self.model_name for m in models)
        except Exception as e:
            health_info["status"] = "unhealthy"
            health_info["error"] = str(e)

        return health_info

    # --- Helper Methods ---
    def _format_prompt(self, prompt: str, context: str = "", system_prompt: str = "") -> str:
        """Enhanced prompt formatting"""
        system_prompt = system_prompt or "Você é um assistente útil e preciso."
        
        parts = []
        if system_prompt:
            parts.append(f"Sistema: {system_prompt}")
        if context:
            parts.append(f"Contexto: {context}")
        
        parts.append(f"Pergunta: {prompt}")
        return "\n\n".join(parts)

    async def list_models(self) -> List[ModelInfo]:
        """List available models with enhanced info"""
        try:
            result = await self._make_request("api/tags", {})
            return [
                ModelInfo(
                    name=model["name"],
                    size=model["size"],
                    modified_at=datetime.fromisoformat(model["modified_at"].replace("Z", "+00:00")),
                    digest=model["digest"],
                    details=model.get("details", {})
                ) for model in result.get("models", [])
            ]
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []

    async def check_model_exists(self) -> bool:
        """Check if model exists with local cache"""
        models = await self.list_models()
        return any(model.name == self.model_name for model in models)

    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history with token counts"""
        return [{
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat(),
            "tokens": msg.tokens
        } for msg in self._conversation_history]

    def clear_conversation(self) -> None:
        """Clear conversation history"""
        self._conversation_history.clear()
        logger.info("Conversation history cleared")
