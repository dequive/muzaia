# backend/app/core/llm_orchestrator.py
import asyncio
import hashlib
import time
import logging # Substitui structlog
import difflib # Substitui fuzzywuzzy
import threading # Para thread-safety no RateLimiter
from typing import Dict, Any, List, Optional, Union, Tuple, Protocol
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from contextlib import asynccontextmanager
import json

# --- Configurações Simuladas (Substituir por um arquivo de configurações real em 'app.core.config') ---
# Para que o código seja executável de forma standalone para teste
class Settings:
    OLLAMA_LLAMA_MODEL: str = "llama3" # Ex: "llama3:8b"
    OLLAMA_GEMMA_MODEL: str = "gemma:2b" # Ex: "gemma2:9b"
    OLLAMA_API_BASE_URL: str = "http://localhost:11434" # URL padrão para Ollama
    OPENROUTER_QWEN_MODEL: str = "qwen/qwen-1_8b-chat" # Ex: "qwen/qwen-2.5-72b-instruct"
    OPENROUTER_API_KEY: str = "sk-or-YOUR_OPENROUTER_API_KEY" # Substitua pela sua chave real
    OPENROUTER_API_BASE_URL: str = "https://openrouter.ai/api/v1"
    COHERE_API_KEY: str = "YOUR_COHERE_API_KEY" # Substitua pela sua chave real
    COHERE_API_BASE_URL: str = "https://api.cohere.ai/v1"
    MAX_QUERY_LENGTH: int = 2000 # Limite de caracteres para a query

settings = Settings() # Instância das configurações

# --- Configuração do logger (usando logging padrão com formatação JSON) ---
# Você pode querer configurar isso globalmente em sua aplicação real,
# não apenas dentro do módulo.
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

# Sobrescreve o handler para formatar como JSON (Exemplo simplificado)
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "name": record.name,
            "levelname": record.levelname,
            "message": record.getMessage(),
        }
        # Adiciona atributos extras (como os bindados por structlog faria)
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        if hasattr(record, 'component'):
            log_record['component'] = record.component
        if hasattr(record, 'model'):
            log_record['model'] = record.model
        if hasattr(record, 'error'):
            log_record['error'] = record.error
        if hasattr(record, 'error_type'):
            log_record['error_type'] = record.error_type
        
        # Se houver exc_info, adiciona o traceback
        if record.exc_info:
            log_record['exc_info'] = self.formatException(record.exc_info)

        return json.dumps(log_record, ensure_ascii=False)

# Aplica o formatador JSON
for handler in log.handlers:
    handler.setFormatter(JsonFormatter())


# --- Enumeradores ---
class ContextType(Enum):
    """Define tipos de contexto suportados para roteamento de modelos."""
    GENERAL = "general"
    LEGAL_RESEARCH = "legal_research"
    CONTRACT_REVIEW = "contract_review"
    DOCUMENT_ANALYSIS = "document_analysis"
    VALIDATION = "validation"
    MULTILINGUAL = "multilingual"

# --- Data Classes para Respostas ---
@dataclass
class LLMResponse:
    """Representa a resposta de um único modelo LLM."""
    model_name: str
    text: str
    confidence_score: float = 0.0 # Score de confiança (0.0 a 1.0)
    metadata: Dict[str, Any] = field(default_factory=dict)
    latency: float = 0.0 # Tempo de resposta em segundos
    tokens_used: int = 0
    error: Optional[str] = None

@dataclass
class OrchestratorResponse:
    """Representa a resposta consolidada do LLM Orchestrator."""
    text: str
    confidence: float
    sources: List[str]
    context: str
    jurisdiction: str
    models_used: List[str]
    processing_time: float
    status: str # "success", "error"
    error: Optional[str] = None
    error_message: Optional[str] = None
    reasoning: Optional[str] = None
    cached: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Converte a instância do dataclass em um dicionário para serialização."""
        return {
            "text": self.text,
            "confidence": self.confidence,
            "sources": self.sources,
            "context": self.context,
            "jurisdiction": self.jurisdiction,
            "models_used": self.models_used,
            "processing_time": self.processing_time,
            "status": self.status,
            "error": self.error,
            "error_message": self.error_message,
            "reasoning": self.reasoning,
            "cached": self.cached
        }

# --- Classes de Exceção Personalizadas ---
class LLMOrchestratorError(Exception):
    """Exceção base para erros no orquestrador."""
    pass

class LLMServiceError(LLMOrchestratorError):
    """Exceção para erros ao interagir com um LLM específico."""
    pass

class ModelNotFoundError(LLMOrchestratorError):
    """Exceção para quando um modelo solicitado não é encontrado."""
    pass

class ConsensusError(LLMOrchestratorError):
    """Exceção para erros no processo de consenso."""
    pass

class InvalidInputError(LLMOrchestratorError):
    """Exceção para entrada inválida."""
    pass

# --- Interfaces e Protocolos ---
class AbstractLLM(Protocol):
    """Protocolo que define a interface esperada para todos os LLMs."""
    model_name: str # Atributo para o nome do modelo

    async def generate(self, prompt: str, context: str) -> 'LLMResponse':
        """
        Gera uma resposta do LLM.
        :param prompt: O prompt de entrada.
        :param context: O contexto da requisição (e.g., 'legal_research', 'general').
        :return: Uma instância de LLMResponse.
        """
        ...
    
    async def close(self):
        """Método para fechar conexões ou liberar recursos do LLM, se aplicável."""
        pass # Default, pode ser sobrescrito por implementações específicas

# --- Implementações de LLM (Simulações) ---
# Em um projeto real, estas classes estariam em 'app/models/local_llm.py' e 'app/models/api_llm.py'
class OllamaLLM(AbstractLLM):
    """Simula a interação com um modelo Ollama."""
    def __init__(self, model_name: str, api_base: str):
        self.model_name = model_name
        self.api_base = api_base
        self.logger = logging.getLogger(f"{__name__}.OllamaLLM").bind(llm_type="ollama", model=model_name, component="LLM")
        self.calls = 0 # Para simular falhas no teste do Circuit Breaker

    async def generate(self, prompt: str, context: str) -> LLMResponse:
        self.logger.info("Chamando Ollama", prompt=prompt[:50], context=context)
        start_time = time.monotonic()
        await asyncio.sleep(0.5)  # Simula latência da API

        # Simulação de erro para Circuit Breaker
        self.calls += 1
        if "samora" in prompt.lower() and self.calls <= 2: # Exemplo de falha simulada
             raise LLMServiceError(f"Erro simulado no Ollama ({self.model_name}) para '{prompt[:20]}'")

        response_text = f"Resposta do {self.model_name} para '{prompt}'. Contexto: {context}. [Simulado Ollama]"
        confidence = 0.85 if "lei" in prompt else 0.75
        latency = time.monotonic() - start_time
        return LLMResponse(
            model_name=self.model_name,
            text=response_text,
            confidence_score=confidence,
            metadata={"sources": [f"ollama://{self.model_name}"]},
            latency=latency
        )

class OpenRouterLLM(AbstractLLM):
    """Simula a interação com um modelo OpenRouter."""
    def __init__(self, model_name: str, api_key: str, api_base: str):
        self.model_name = model_name
        self.api_key = api_key
        self.api_base = api_base
        self.logger = logging.getLogger(f"{__name__}.OpenRouterLLM").bind(llm_type="openrouter", model=model_name, component="LLM")

    async def generate(self, prompt: str, context: str) -> LLMResponse:
        self.logger.info("Chamando OpenRouter", prompt=prompt[:50], context=context)
        start_time = time.monotonic()
        await asyncio.sleep(0.7) # Simula latência da API
        response_text = f"Resposta do {self.model_name} (via OpenRouter) para '{prompt}'. Contexto: {context}. [Simulado OpenRouter]"
        confidence = 0.9 if "contratos" in prompt else 0.8
        latency = time.monotonic() - start_time
        return LLMResponse(
            model_name=self.model_name,
            text=response_text,
            confidence_score=confidence,
            metadata={"sources": [f"openrouter://{self.model_name}"]},
            latency=latency
        )

class CohereLLM(AbstractLLM):
    """Simula a interação com um modelo Cohere."""
    def __init__(self, api_key: str, api_base: str):
        self.model_name = "command" # Cohere's default command model
        self.api_key = api_key
        self.api_base = api_base
        self.logger = logging.getLogger(f"{__name__}.CohereLLM").bind(llm_type="cohere", model=self.model_name, component="LLM")

    async def generate(self, prompt: str, context: str) -> LLMResponse:
        self.logger.info("Chamando Cohere", prompt=prompt[:50], context=context)
        start_time = time.monotonic()
        await asyncio.sleep(0.6) # Simula latência da API
        response_text = f"Resposta do Cohere Command para '{prompt}'. Contexto: {context}. [Simulado Cohere]"
        confidence = 0.88 if "Moçambique" in prompt else 0.78
        latency = time.monotonic() - start_time
        return LLMResponse(
            model_name=self.model_name,
            text=response_text,
            confidence_score=confidence,
            metadata={"sources": ["cohere://command"]},
            latency=latency
        )

# --- Data Classes para Configuração e Resposta ---
@dataclass
class ModelConfig:
    name: str
    priority: int # Usar int para ModelPriority (Enum é difícil de serializar/desserializar)
    timeout: float = 30.0
    max_retries: int = 2
    weight: float = 1.0
    specialized_contexts: List[str] = field(default_factory=list)
    max_concurrent: int = 5


# --- Implementação dos Componentes de Resiliência e Consenso ---

class CircuitBreaker:
    """
    Implementa o padrão Circuit Breaker para prevenir requisições a serviços falhos.
    """
    def __init__(self, threshold: int = 3, reset_timeout: int = 300):
        self.threshold = threshold
        self.reset_timeout = reset_timeout
        self._state: Dict[str, Dict[str, Any]] = {} # {'resource_name': {'failures': N, 'open_until': datetime_obj}}
        self.logger = logging.getLogger(f"{__name__}.CircuitBreaker").bind(component="CircuitBreaker")

    def is_open(self, resource: str) -> bool:
        """Verifica se o circuito para o recurso está aberto."""
        state = self._state.get(resource, {})
        if not state or not state.get('open_until'):
            return False # Circuito fechado por padrão ou nunca esteve aberto

        current_time = datetime.now()
        open_until = state['open_until']

        if current_time < open_until:
            self.logger.debug("Circuito ABERTO", resource=resource, open_until=open_until.isoformat(),
                              remaining_time=str(open_until - current_time))
            return True # Ainda no período de abertura

        # Se o tempo de abertura passou, permite uma única tentativa (HALF-OPEN logic via reset)
        self.logger.info("Circuito em HALF-OPEN (tentativa de reabertura)", resource=resource)
        self.reset(resource) # Reseta o contador de falhas para permitir uma nova tentativa
        return False # Comportamento de HALF-OPEN: permite uma tentativa, mas fecha o CB logicamente

    def record_failure(self, resource: str):
        """Registra uma falha para o recurso."""
        current_state = self._state.get(resource, {'failures': 0, 'open_until': None})
        current_state['failures'] += 1

        if current_state['failures'] >= self.threshold and not current_state['open_until']:
            current_state['open_until'] = datetime.now() + timedelta(seconds=self.reset_timeout)
            self.logger.error("Circuito ABERTO", resource=resource, failures=current_state['failures'],
                              threshold=self.threshold, open_until=current_state['open_until'].isoformat())
        else:
            self.logger.debug("Falha registrada", resource=resource, failures=current_state['failures'])
        self._state[resource] = current_state

    def record_success(self, resource: str):
        """Registra um sucesso para o recurso e reseta o circuito se estava aberto."""
        if self._state.get(resource, {}).get('open_until'):
            self.logger.info("Circuito FECHADO por sucesso", resource=resource)
        self.reset(resource)

    def reset(self, resource: str):
        """Reseta o estado do circuito para o recurso."""
        self._state[resource] = {'failures': 0, 'open_until': None}
        self.logger.debug("Circuito RESETADO", resource=resource)

class RateLimiter:
    """
    Controla a taxa de requisições por chave (e.g., user_id) usando uma janela deslizante.
    Thread-safe com uso de threading.Lock.
    """
    def __init__(self, max_calls: int = 100, period: int = 60):
        self.max_calls = max_calls
        self.period = period
        self._calls: Dict[str, List[float]] = {}
        self._lock = threading.Lock() # ✅ Thread safety
        self.logger = logging.getLogger(f"{__name__}.RateLimiter").bind(component="RateLimiter")

    async def check_limit(self, key: str) -> bool:
        """
        Verifica se uma nova requisição pode ser feita.
        :param key: A chave para o limite de taxa (e.g., ID do usuário).
        :return: True se a requisição é permitida, False caso contrário.
        """
        with self._lock: # Protege a seção crítica
            now = time.time()
            calls = self._calls.get(key, [])

            # Remove chamadas que estão fora da janela de tempo
            calls = [call for call in calls if now - call < self.period]
            self._calls[key] = calls # Atualiza a lista de chamadas

            if len(calls) >= self.max_calls:
                self.logger.warning("Limite de requisições excedido", key=key, calls_in_period=len(calls),
                                    max_calls=self.max_calls, period=self.period)
                return False

            calls.append(now)
            self.logger.debug("Requisição permitida", key=key, calls_in_period=len(calls))
            return True

class ConsensusEngine:
    """
    Consolida e valida respostas de múltiplos LLMs.
    """
    def __init__(self):
        self.min_agreement = 0.6  # 60% de similaridade mínima para consenso
        self.logger = logging.getLogger(f"{__name__}.ConsensusEngine").bind(component="ConsensusEngine")

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade usando difflib.SequenceMatcher"""
        return difflib.SequenceMatcher(None, text1, text2).ratio()

    def merge_responses(self, responses: List[LLMResponse]) -> Dict[str, Any]:
        """
        Mescla e consolida as respostas dos LLMs. Este método é SÍNCRONO.
        :param responses: Lista de LLMResponse a serem consolidadas.
        :return: Um dicionário contendo o texto consolidado, confiança, fontes e o raciocínio.
        :raises ConsensusError: Se não houver respostas ou a concordância for baixa.
        """
        if not responses:
            self.logger.error("Nenhuma resposta para consolidar")
            raise ConsensusError("Nenhuma resposta para consolidar.")

        # Se há apenas uma resposta, retorna-a diretamente
        if len(responses) == 1:
            self.logger.info("Apenas uma resposta disponível, retornando diretamente.")
            return {
                "text": responses[0].text,
                "confidence": responses[0].confidence_score,
                "sources": responses[0].metadata.get("sources", []),
                "original_responses": responses,
                "reasoning": f"Consenso direto: Apenas um modelo ({responses[0].model_name}) respondeu."
            }

        # Calcula similaridade entre as respostas
        # Usamos a primeira resposta como base para o cálculo de similaridade
        base_text = responses[0].text
        similarity_scores = []
        for i, r in enumerate(responses):
            if i == 0: continue # Ignora a primeira resposta para o cálculo contra si mesma
            score = self._calculate_similarity(base_text, r.text)
            similarity_scores.append(score)
            self.logger.debug("Similaridade calculada", base_model=base_text[:20], target_model=r.text[:20], score=f"{score:.2f}")

        avg_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 1.0

        if avg_similarity < self.min_agreement:
            self.logger.warning("Baixa concordância entre modelos", avg_similarity=f"{avg_similarity:.2f}",
                                min_agreement=f"{self.min_agreement:.2f}")
            raise ConsensusError(f"Baixa concordância entre modelos: {avg_similarity:.2f}. Mínimo exigido: {self.min_agreement:.2f}.")

        # Calcula média ponderada das confianças
        total_confidence_score = sum(r.confidence_score for r in responses)
        
        # Pondera textos pela confiança
        weighted_texts = []
        for r in responses:
            weight = r.confidence_score / total_confidence_score if total_confidence_score > 0 else 1.0 / len(responses)
            weighted_texts.append((r.text, weight))

        # Combina as respostas. Uma estratégia simples é concatenar, ordenada por peso.
        # Para um cenário real, considerar um LLM para fazer a sumarização das respostas.
        combined_text = " ".join(
            text for text, weight in sorted(weighted_texts, key=lambda x: -x[1])
        )

        all_sources = list(set(
            src for r in responses
            for src in r.metadata.get("sources", [])
        ))
        
        # Raciocínio de decisão
        reasoning = (f"Consenso baseado em {len(responses)} respostas com similaridade média de {avg_similarity:.2f}. "
                     f"Confiança média: {total_confidence_score / len(responses):.2f}. "
                     f"Respostas combinadas por ordem de confiança individual.")

        self.logger.info("Respostas consolidadas", avg_similarity=f"{avg_similarity:.2f}", confidence=f"{total_confidence_score / len(responses):.2f}")
        return {
            "text": combined_text,
            "confidence": total_confidence_score / len(responses),
            "sources": all_sources,
            "original_responses": responses,
            "reasoning": reasoning
        }

# --- Componentes para Cache e Métricas (Implementações mínimas para o exemplo) ---
# Em um projeto real, estariam em 'app/core/cache.py' e 'app/core/metrics.py'
class AsyncCache:
    """Cache assíncrono simples (in-memory) para o exemplo."""
    def __init__(self, ttl: timedelta = timedelta(hours=1)):
        self.cache: Dict[str, Tuple[Any, datetime]] = {}
        self.ttl = ttl
        self.logger = logging.getLogger(f"{__name__}.AsyncCache").bind(component="AsyncCache")

    async def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            value, expiration_time = self.cache[key]
            if datetime.now() < expiration_time:
                self.logger.debug("Cache hit", key=key)
                # Recria o objeto OrchestratorResponse a partir do dicionário
                if isinstance(value, dict) and 'text' in value and 'confidence' in value:
                    return OrchestratorResponse(**value)
                return value
            else:
                del self.cache[key]
                self.logger.debug("Cache expirado", key=key)
        self.logger.debug("Cache miss", key=key)
        return None

    async def set(self, key: str, value: Any):
        expiration_time = datetime.now() + self.ttl
        # Armazena a versão serializável (dicionário)
        if hasattr(value, 'to_dict') and callable(value.to_dict):
            self.cache[key] = (value.to_dict(), expiration_time)
        else:
            self.cache[key] = (value, expiration_time)
        self.logger.debug("Cache set", key=key, expires_at=expiration_time.isoformat())

    async def health_check(self) -> Dict[str, Any]:
        return {"healthy": True, "type": "in-memory"}

    async def close(self):
        self.logger.info("Cache fechado (in-memory)")
        self.cache.clear()

class MetricsCollector:
    """Coletor de métricas assíncrono simples (in-memory) para o exemplo."""
    def __init__(self):
        self.data: Dict[str, Any] = {'orchestrator_usage': [], 'model_usage': []}
        self.logger = logging.getLogger(f"{__name__}.MetricsCollector").bind(component="MetricsCollector")

    async def record_orchestrator_usage(self, **kwargs):
        self.data['orchestrator_usage'].append({**kwargs, "timestamp": datetime.now().isoformat()})
        self.logger.debug("Métrica do orquestrador registrada", metrics=kwargs)

    async def record_model_usage(self, **kwargs):
        self.data['model_usage'].append({**kwargs, "timestamp": datetime.now().isoformat()})
        self.logger.debug("Métrica do modelo registrada", metrics=kwargs)

    async def health_check(self) -> Dict[str, Any]:
        return {"healthy": True, "type": "in-memory"}

    async def close(self):
        self.logger.info("Coletor de métricas fechado (in-memory)")
        # Em um sistema real, aqui você descarregaria as métricas para um sistema externo (Prometheus, Grafana, etc.)


# --- LLMOrchestrator Class ---
class LLMOrchestrator:
    """
    Orquestrador avançado para múltiplos modelos LLM com capacidades de:
    - Roteamento inteligente por contexto
    - Consenso entre modelos com pesos
    - Cache de respostas
    - Métricas e monitoramento
    - Tratamento robusto de erros
    - Fallback automático
    - Circuit Breaker e Rate Limiting
    """
    def __init__(self, 
                 config: Optional[Dict[str, Any]] = None,
                 circuit_breaker: Optional[CircuitBreaker] = None,
                 rate_limiter: Optional[RateLimiter] = None,
                 consensus_engine: Optional[ConsensusEngine] = None,
                 cache: Optional[AsyncCache] = None,
                 metrics_collector: Optional[MetricsCollector] = None):
        
        self.config = config or {}
        self.logger = logging.getLogger(__name__).bind(component="LLMOrchestrator") # Logger próprio para a classe

        # Injeção de dependências ou inicialização com defaults
        self.circuit_breaker = circuit_breaker or CircuitBreaker(
            threshold=self.config.get('circuit_breaker_threshold', 3),
            reset_timeout=self.config.get('circuit_breaker_open_duration', 300)
        )
        self.rate_limiter = rate_limiter or RateLimiter(
            max_calls=self.config.get('rate_limit_max_requests', 100),
            period=self.config.get('rate_limit_window', 60)
        )
        self.consensus_engine = consensus_engine or ConsensusEngine()
        self.cache = cache or AsyncCache(ttl=timedelta(hours=1))
        self.metrics = metrics_collector or MetricsCollector()
        
        # Modelos e configurações internas
        self.models: Dict[str, AbstractLLM] = {}
        self.model_configs: Dict[str, ModelConfig] = {}
        self.context_router: Dict[str, List[str]] = {}
        self._model_semaphores: Dict[str, asyncio.Semaphore] = {}
        self._connection_manager_task: Optional[asyncio.Task] = None 

        # Configurações operacionais
        self.default_timeout = self.config.get('default_timeout', 30.0)
        self.max_retries = self.config.get('max_retries', 2)
        self.enable_fallback = self.config.get('enable_fallback', True)
        self.enable_cache = self.config.get('enable_cache', True) # Novo parâmetro para habilitar/desabilitar cache
        
        self.logger.info("LLMOrchestrator inicializado", config_keys=list(self.config.keys()))

    async def initialize(self):
        """
        Inicializa todos os modelos LLM e componentes assíncronos do orquestrador.
        Este método deve ser chamado uma única vez no startup da aplicação.
        """
        self.logger.info("Iniciando inicialização assíncrona do LLMOrchestrator...")
        try:
            self._init_models() # Síncrono: cria instâncias dos modelos
            self._init_model_configs() # Síncrono: carrega configs detalhadas
            self._init_context_router() # Síncrono: define regras de roteamento

            # Inicializa semáforos para controle de concorrência por modelo
            for model_name, model_cfg in self.model_configs.items():
                if model_name in self.models: # Apenas para modelos que foram instanciados
                    self._model_semaphores[model_name] = asyncio.Semaphore(model_cfg.max_concurrent)
                
            await self._initial_health_check() # Verifica a saúde inicial dos modelos
            self._start_connection_manager() # Inicia tarefa para manter conexões ativas

            self.logger.info("LLMOrchestrator pronto para uso.")
        except Exception as e:
            self.logger.critical("Falha fatal na inicialização do LLMOrchestrator", error=str(e), exc_info=True)
            raise LLMOrchestratorError(f"Falha na inicialização do orquestrador: {e}")

    def _init_models(self):
        """Cria instâncias dos modelos LLM (Ollama, OpenRouter, Cohere)."""
        self.logger.info("Carregando instâncias de modelos LLM...")
        try:
            self.models["llama"] = OllamaLLM(model_name=settings.OLLAMA_LLAMA_MODEL, api_base=settings.OLLAMA_API_BASE_URL)
            self.models["gemma"] = OllamaLLM(model_name=settings.OLLAMA_GEMMA_MODEL, api_base=settings.OLLAMA_API_BASE_URL)
            self.models["qwen"] = OpenRouterLLM(model_name=settings.OPENROUTER_QWEN_MODEL, api_key=settings.OPENROUTER_API_KEY, api_base=settings.OPENROUTER_API_BASE_URL)
            self.models["command"] = CohereLLM(api_key=settings.COHERE_API_KEY, api_base=settings.COHERE_API_BASE_URL)
            self.logger.info("Instâncias de modelos LLM criadas.", loaded_models=list(self.models.keys()))
        except Exception as e:
            self.logger.critical("Erro ao criar instâncias de modelos LLM", error=str(e), exc_info=True)
            raise LLMOrchestratorError(f"Erro ao inicializar modelos LLM: {e}")

    def _init_model_configs(self) -> Dict[str, ModelConfig]:
        """Inicializa configurações detalhadas para cada modelo."""
        configs = {}
        # Assegurar que os nomes dos modelos aqui correspondem aos nomes em self.models
        configs["llama"] = ModelConfig(name="llama", priority=1, timeout=20.0, specialized_contexts=[ContextType.GENERAL.value, ContextType.MULTILINGUAL.value], max_concurrent=5)
        configs["gemma"] = ModelConfig(name="gemma", priority=2, timeout=25.0, specialized_contexts=[ContextType.VALIDATION.value, ContextType.CONTRACT_REVIEW.value], max_concurrent=5)
        configs["qwen"] = ModelConfig(name="qwen", priority=1, timeout=30.0, weight=1.2, specialized_contexts=[ContextType.LEGAL_RESEARCH.value, ContextType.MULTILINGUAL.value], max_concurrent=10)
        configs["command"] = ModelConfig(name="command", priority=1, timeout=35.0, weight=1.1, specialized_contexts=[ContextType.DOCUMENT_ANALYSIS.value, ContextType.LEGAL_RESEARCH.value], max_concurrent=10)
        
        self.model_configs = configs
        self.logger.info("Configurações de modelos carregadas.", num_configs=len(configs))
        return configs

    def _init_context_router(self) -> Dict[str, List[str]]:
        """Inicializa as regras de roteamento de modelos por contexto."""
        default_router = {
            ContextType.GENERAL.value: ["llama", "qwen", "command", "gemma"], # Ordem de preferência
            ContextType.DOCUMENT_ANALYSIS.value: ["command", "llama"],
            ContextType.MULTILINGUAL.value: ["qwen", "llama"],
            ContextType.VALIDATION.value: ["gemma", "command"],
            ContextType.LEGAL_RESEARCH.value: ["qwen", "command"], # Qwen e Command para pesquisa legal
            ContextType.CONTRACT_REVIEW.value: ["command", "gemma"]
        }
        # Permite sobrescrever o roteamento via configuração do orquestrador
        self.context_router = self.config.get("context_router", default_router)
        self.logger.info("Roteador de contexto inicializado.")
        return self.context_router

    async def _initial_health_check(self):
        """Executa uma verificação de saúde inicial de todos os modelos carregados."""
        self.logger.info("Executando verificação de saúde inicial dos modelos...")
        health_status = await self.get_health_status()
        unhealthy_models = [name for name, status in health_status.get('models', {}).items() if status.get('status') != 'healthy']
        
        if unhealthy_models:
            self.logger.warning("Modelos com problemas detectados na inicialização", unhealthy_models=unhealthy_models)
            # Se todos os modelos primários falharem na inicialização, levanta um erro fatal
            # Identifica modelos primários que deveriam estar disponíveis para contextos básicos
            primary_models_for_general_context = [
                m for m in self.context_router.get(ContextType.GENERAL.value, []) 
                if m in self.models and self.model_configs.get(m, ModelConfig(m, 99)).priority <= 1
            ]
            
            if not primary_models_for_general_context or all(model in unhealthy_models for model in primary_models_for_general_context):
                raise LLMOrchestratorError("Todos os modelos primários para contexto geral estão indisponíveis na inicialização.")
        else:
            self.logger.info("Todos os modelos estão saudáveis na inicialização.")

    def _start_connection_manager(self):
        """Inicia uma tarefa em background para manter as conexões dos modelos ativas (ping)."""
        if self._connection_manager_task:
            self._connection_manager_task.cancel() # Cancela se já estiver rodando
        self._connection_manager_task = asyncio.create_task(self._maintain_connections_loop())
        self.logger.info("Gerenciador de conexões iniciado.")

    async def _maintain_connections_loop(self):
        """Loop para periodicamente 'pingar' os modelos e manter as conexões ativas."""
        while True:
            self.logger.debug("Iniciando ciclo de manutenção de conexões.")
            for name, model_instance in self.models.items():
                # Só tenta pingar se o Circuit Breaker não estiver aberto
                if not self.circuit_breaker.is_open(name):
                    try:
                        # Tenta uma chamada leve para manter a conexão
                        await asyncio.wait_for(model_instance.generate("health_check", "validation"), timeout=5.0)
                        self.logger.debug(f"Ping bem-sucedido para o modelo {name}.")
                        self.circuit_breaker.record_success(name) # Garante que o CB está fechado
                    except Exception as e:
                        self.logger.warning(f"Falha no ping para o modelo {name}: {e}. Registrando falha no CB.", error=str(e))
                        self.circuit_breaker.record_failure(name)
                else:
                    self.logger.debug(f"Ping pulado para o modelo {name}, circuit breaker está aberto.")
            await asyncio.sleep(self.config.get('connection_maintain_interval', 300)) # Padrão: 5 minutos

    def _generate_cache_key(self, query: str, context: str, jurisdiction: str, min_confidence: float) -> str:
        """Gera uma chave única para o cache baseada nos parâmetros da consulta."""
        content = f"{query}:{context}:{jurisdiction}:{min_confidence}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def _select_models_for_context(self, context: str) -> List[str]:
        """Seleciona modelos para um contexto, aplicando regras de Circuit Breaker e fallback."""
        
        # Prioriza modelos configurados para o contexto
        configured_models = self.context_router.get(context, [])
        
        # Filtra modelos que estão com o Circuit Breaker aberto
        available_models = [m for m in configured_models if m in self.models and not self.circuit_breaker.is_open(m)]
        
        # Se não houver modelos disponíveis para o contexto, tenta fallback
        if not available_models and self.enable_fallback:
            self.logger.warning(f"Nenhum modelo principal disponível para o contexto '{context}'. Tentando fallback.")
            # Fallback: tenta qualquer modelo disponível que não esteja com o Circuit Breaker aberto
            all_available = [m for m in self.models.keys() if not self.circuit_breaker.is_open(m)]
            
            # Ordena modelos de fallback por prioridade (menor número = maior prioridade)
            available_models = sorted(all_available, key=lambda m: self.model_configs.get(m, ModelConfig(m, 99)).priority)
            
            if not available_models:
                self.logger.error("Nenhum modelo de fallback disponível.")
        
        self.logger.info("Modelos selecionados", context=context, models=available_models)
        return available_models

    def _enhance_query(self, query: str, jurisdiction: str) -> str:
        """Adiciona informações de jurisdição ao prompt da query."""
        jurisdiction_phrases = {
            "MZ": "Considerando a legislação de Moçambique",
            "BR": "Considerando a legislação brasileira",
            "US": "Considering US legislation",
            "EU": "Considering EU legislation"
        }
        prefix = jurisdiction_phrases.get(jurisdiction, f"Considerando a legislação de {jurisdiction}")
        return f"[{prefix}] {query}"

    def _validate_input(self, query: str, context: str, min_confidence: float) -> None:
        """Valida os parâmetros de entrada da requisição."""
        if not query or not query.strip():
            raise InvalidInputError("A query não pode estar vazia.")
        if len(query) > settings.MAX_QUERY_LENGTH:
            raise InvalidInputError(f"A query excede o comprimento máximo permitido de {settings.MAX_QUERY_LENGTH} caracteres.")
        
        # Valida se o contexto é reconhecido pelo ContextType Enum
        if context not in [ctx.value for ctx in ContextType]:
            self.logger.warning("Contexto não reconhecido", requested_context=context, valid_contexts=[ctx.value for ctx in ContextType])
            # Decisão: para este caso, vamos permitir, mas com um aviso. Poderia lançar um InvalidInputError.
            # raise InvalidInputError(f"Contexto '{context}' inválido. Contextos válidos: {[ctx.value for ctx in ContextType]}.")
        
        if not (0.0 <= min_confidence <= 1.0): # Confiança entre 0.0 e 1.0
            raise InvalidInputError("`min_confidence` deve ser um valor entre 0.0 e 1.0.")
        self.logger.debug("Entrada validada com sucesso.")

    async def _query_single_model_with_retry(
        self,
        model_name: str,
        query: str,
        context: str
    ) -> Optional[LLMResponse]:
        """
        Consulta um único modelo LLM com retentativas, timeouts e controle de concorrência.
        Retorna a LLMResponse em caso de sucesso ou None em caso de falha persistente.
        """
        model_instance = self.models.get(model_name)
        if not model_instance:
            self.logger.error("Instância do modelo não encontrada", model_name=model_name)
            self.circuit_breaker.record_failure(model_name) # Registrar falha mesmo se o modelo não existe
            return None

        # Obter configurações específicas do modelo ou usar defaults do orquestrador
        model_cfg = self.model_configs.get(model_name, ModelConfig(model_name, priority=99, timeout=self.default_timeout, max_retries=self.max_retries))
        max_retries = model_cfg.max_retries
        timeout_per_attempt = model_cfg.timeout
        
        last_error = None
        
        # Controle de concorrência por modelo
        # Adiciona uma camada de proteção caso o semáforo para o modelo não esteja inicializado
        semaphore = self._model_semaphores.get(model_name, asyncio.Semaphore(model_cfg.max_concurrent))
        
        async with semaphore: 
            for attempt in range(max_retries + 1):
                if self.circuit_breaker.is_open(model_name):
                    self.logger.warning("Circuit breaker aberto, pulando consulta", model_name=model_name)
                    return None # Não tenta se o circuito está aberto

                try:
                    start_single_query = time.monotonic()
                    # ✅ Correção: Uso de asyncio.wait_for para tratamento de timeout
                    result = await asyncio.wait_for(
                        model_instance.generate(query, context), 
                        timeout=timeout_per_attempt
                    )
                    
                    result.latency = time.monotonic() - start_single_query
                    self.circuit_breaker.record_success(model_name)
                    self.logger.info("Consulta a modelo bem-sucedida", model_name=model_name,
                                     latency=f"{result.latency:.2f}s", attempt=attempt+1)
                    return result

                except asyncio.TimeoutError:
                    last_error = f"Timeout na consulta ao modelo {model_name} após {timeout_per_attempt}s"
                    self.logger.error(last_error, model_name=model_name, attempt=attempt+1)
                    self.circuit_breaker.record_failure(model_name)
                except Exception as e:
                    last_error = f"Falha ao consultar modelo {model_name}: {str(e)}"
                    self.logger.error(last_error, model_name=model_name, attempt=attempt+1, exc_info=True)
                    self.circuit_breaker.record_failure(model_name)

                if attempt < max_retries:
                    sleep_time = 2 ** attempt # Backoff exponencial
                    self.logger.info("Tentando novamente...", model_name=model_name, attempt=attempt+1, sleep_for=f"{sleep_time:.2f}s")
                    await asyncio.sleep(sleep_time)

            self.logger.error("Todas as retentativas falharam para o modelo", model_name=model_name, final_error=last_error)
            return None # Indica que o modelo falhou após todas as retentativas

    async def _query_models(
        self,
        model_names: List[str],
        query: str,
        context: str,
        jurisdiction: str
    ) -> List[LLMResponse]:
        """
        Executa consultas a múltiplos modelos em paralelo.
        """
        tasks = []
        enhanced_query = self._enhance_query(query, jurisdiction)

        for model_name in model_names:
            tasks.append(
                self._query_single_model_with_retry(
                    model_name,
                    enhanced_query,
                    context
                )
            )

        # wait for all tasks to complete and filter out None results (failed queries)
        results = await asyncio.gather(*tasks)
        successful_responses = [r for r in results if r is not None]

        if not successful_responses:
            self.logger.error("Nenhum modelo retornou uma resposta bem-sucedida após as tentativas.")
            raise LLMServiceError("Nenhum LLM retornou uma resposta utilizável após as retentativas.")

        self.logger.info("Consultas aos modelos concluídas", successful_models=[r.model_name for r in successful_responses])
        return successful_responses

    def _build_final_response(
        self,
        consensus_result: Dict[str, Any],
        context: str,
        jurisdiction: str,
        models_queried: List[str], # Os modelos que foram originalmente selecionados
        start_time: float,
        cached: bool = False
    ) -> OrchestratorResponse:
        """Constrói a resposta final do orquestrador com base no resultado do consenso."""
        processing_time = time.monotonic() - start_time
        final_confidence = consensus_result["confidence"] 
        
        self.logger.info("Resposta final construída", processing_time=f"{processing_time:.2f}s",
                         confidence=f"{final_confidence:.2f}", cached=cached)

        return OrchestratorResponse(
            text=consensus_result["text"],
            confidence=final_confidence,
            sources=consensus_result["sources"],
            context=context,
            jurisdiction=jurisdiction,
            models_used=list(set(m.model_name for m in consensus_result.get('original_responses', []))), # Modelos que de fato contribuíram para o consenso
            processing_time=processing_time,
            status="success",
            error=None,
            error_message=None,
            reasoning=consensus_result.get("reasoning", "Nenhum raciocínio de consenso fornecido."),
            cached=cached
        )

    def _build_error_response(
        self,
        error: Exception,
        context: str,
        jurisdiction: str,
        start_time: float
    ) -> OrchestratorResponse:
        """Constrói uma resposta de erro padronizada para o usuário."""
        processing_time = time.monotonic() - start_time
        error_message = str(error)
        status = "error"
        # O logger já está "bindado" com request_id e user_id
        self.logger.error("Erro na orquestração", error=error_message, processing_time=f"{processing_time:.2f}s", exc_info=True)

        return OrchestratorResponse(
            text="Ocorreu um erro ao processar sua requisição. Por favor, tente novamente mais tarde.",
            confidence=0.0,
            sources=[],
            context=context,
            jurisdiction=jurisdiction,
            models_used=[],
            processing_time=processing_time,
            status=status,
            error=error_message,
            reasoning="A requisição falhou devido a um erro no orquestrador ou nos modelos subjacentes."
        )

    async def generate(
        self,
        query: str,
        context: str = ContextType.GENERAL.value,
        jurisdiction: str = "MZ",
        min_confidence: float = 0.7, # Confiança esperada entre 0.0 e 1.0
        user_id: Optional[str] = None
    ) -> OrchestratorResponse:
        """
        Orquestra a geração de texto usando múltiplos LLMs, com resiliência e consenso.
        """
        start_time = time.monotonic()
        request_id = hashlib.md5(f"{query}-{time.time()}".encode()).hexdigest()
        
        # ✅ Correção: Cria um logger local com atributos específicos para a requisição
        # Isso garante que cada log emitido dentro deste método inclua request_id e user_id
        local_logger = self.logger.bind(request_id=request_id, user_id=user_id, 
                                        query_len=len(query), context=context, 
                                        jurisdiction=jurisdiction, min_confidence=min_confidence)
        local_logger.info("Requisição de geração recebida.")

        try:
            # 1. Verificação de rate limit
            if not await self.rate_limiter.check_limit(user_id or "global_anon"):
                local_logger.warning("Rate limit excedido.")
                raise LLMOrchestratorError("Limite de requisições excedido. Por favor, tente novamente mais tarde.")

            # 2. Validação de entrada
            self._validate_input(query, context, min_confidence)

            # 3. Tentativa de cache
            if self.enable_cache:
                cache_key = self._generate_cache_key(query, context, jurisdiction, min_confidence)
                cached_response = await self.cache.get(cache_key)
                if cached_response:
                    local_logger.info("Resposta servida do cache.", cache_key=cache_key)
                    # Atualiza o tempo de processamento para refletir o tempo de cache
                    cached_response.processing_time = time.monotonic() - start_time
                    cached_response.cached = True
                    # Registrar métricas de sucesso (cache)
                    await self.metrics.record_orchestrator_usage(
                        context=context,
                        models_used=[], # N/A para cache
                        processing_time=cached_response.processing_time,
                        confidence_score=cached_response.confidence,
                        success=True,
                        cached=True,
                        user_id=user_id
                    )
                    return cached_response

            # 4. Seleção de modelos para o contexto
            selected_models = self._select_models_for_context(context)
            if not selected_models:
                local_logger.error("Nenhum modelo disponível para o contexto após filtro de CB e fallback.")
                raise LLMOrchestratorError(f"Nenhum modelo disponível para o contexto '{context}'.")

            # 5. Consulta aos modelos em paralelo
            responses = await self._query_models(selected_models, query, context, jurisdiction)
            
            # Se _query_models não lançar exceção, significa que há respostas válidas.
            
            # 6. Aplicação do consenso
            consensus_result = self.consensus_engine.merge_responses(responses) # Método agora é síncrono

            # 7. Verificação de confiança mínima (se a confiança consolidada for insuficiente)
            if consensus_result["confidence"] < min_confidence:
                local_logger.warning("Confiança da resposta consolidada abaixo do mínimo exigido.",
                                     confidence=f"{consensus_result['confidence']:.2f}",
                                     min_confidence=f"{min_confidence:.2f}")
                raise LLMOrchestratorError(
                    f"Confiança da resposta consolidada ({consensus_result['confidence']:.2f}) "
                    f"está abaixo do mínimo exigido ({min_confidence:.2f}). Revisão humana recomendada."
                )

            # 8. Construção da resposta final
            orchestrator_response = self._build_final_response(
                consensus_result, context, jurisdiction, selected_models, start_time, cached=False
            )
            
            # 9. Armazenar no cache
            if self.enable_cache:
                await self.cache.set(cache_key, orchestrator_response)
                local_logger.info("Resposta armazenada no cache.", cache_key=cache_key)

            # 10. Registrar métricas de sucesso
            await self.metrics.record_orchestrator_usage(
                context=context,
                models_used=orchestrator_response.models_used,
                processing_time=orchestrator_response.processing_time,
                confidence_score=orchestrator_response.confidence,
                success=True,
                cached=orchestrator_response.cached,
                user_id=user_id
            )
            for llm_res in responses: # Registrar métricas de cada modelo que respondeu
                await self.metrics.record_model_usage(
                    model_name=llm_res.model_name,
                    processing_time=llm_res.latency,
                    tokens_used=llm_res.tokens_used,
                    success=True
                )
            
            local_logger.info("Requisição processada com sucesso.", final_confidence=f"{orchestrator_response.confidence:.2f}")
            return orchestrator_response

        except LLMOrchestratorError as e:
            # Captura exceções específicas do orquestrador
            local_logger.error("Erro controlado na orquestração", error=str(e), error_type=type(e).__name__, exc_info=True)
            error_resp = self._build_error_response(e, context, jurisdiction, start_time)
            # Registrar métricas de falha
            await self.metrics.record_orchestrator_usage(
                context=context,
                models_used=error_resp.models_used, # Pode estar vazia
                processing_time=error_resp.processing_time,
                confidence_score=0.0,
                success=False,
                cached=False,
                user_id=user_id
            )
            return error_resp # Retorna o objeto de resposta de erro

        except Exception as e:
            # Captura qualquer outra exceção inesperada e as envolve em LLMOrchestratorError
            local_logger.critical("Erro inesperado e não tratado na orquestração", error=str(e), exc_info=True)
            error_resp = self._build_error_response(LLMOrchestratorError("Erro interno inesperado."), context, jurisdiction, start_time)
            # Registrar métricas de falha
            await self.metrics.record_orchestrator_usage(
                context=context,
                models_used=error_resp.models_used,
                processing_time=error_resp.processing_time,
                confidence_score=0.0,
                success=False,
                cached=False,
                user_id=user_id
            )
            return error_resp # Retorna o objeto de resposta de erro

    async def get_health_status(self) -> Dict[str, Any]:
        """Retorna o status de saúde do orquestrador e seus componentes."""
        self.logger.debug("Verificando status de saúde do orquestrador e modelos...")
        model_health: Dict[str, Any] = {}
        overall_healthy = True

        async def check_single_model_health(name: str, model_instance: AbstractLLM):
            try:
                # Tenta uma chamada leve (ping) para verificar a funcionalidade básica
                start_time = time.monotonic()
                await asyncio.wait_for(model_instance.generate("health_check_ping", "validation"), timeout=7.0)
                latency_ms = (time.monotonic() - start_time) * 1000
                model_health[name] = {
                    "status": "healthy",
                    "latency_ms": f"{latency_ms:.2f}",
                    "circuit_breaker_open": self.circuit_breaker.is_open(name)
                }
                self.logger.debug(f"Health check do modelo {name} bem-sucedido.")
            except Exception as e:
                nonlocal overall_healthy
                overall_healthy = False
                model_health[name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "circuit_breaker_open": self.circuit_breaker.is_open(name)
                }
                self.logger.error(f"Health check do modelo {name} falhou.", error=str(e), exc_info=True)

        tasks = []
        for name, model_instance in self.models.items():
            tasks.append(check_single_model_health(name, model_instance))

        await asyncio.gather(*tasks) # Executa todas as checagens em paralelo

        cache_status = await self.cache.health_check()
        metrics_status = await self.metrics.health_check()

        if not cache_status.get("healthy") or not metrics_status.get("healthy"):
            overall_healthy = False
            self.logger.warning("Componentes auxiliares não saudáveis.", cache=cache_status, metrics=metrics_status)
            
        self.logger.info("Relatório de saúde do orquestrador concluído.", overall_status="healthy" if overall_healthy else "unhealthy")

        return {
            "orchestrator_status": "healthy" if overall_healthy else "unhealthy",
            "models": model_health,
            "cache_status": cache_status,
            "metrics_status": metrics_status,
            "timestamp": datetime.now(datetime.timezone.utc).isoformat()
        }
            
    async def close(self):
        """Liberação controlada de todos os recursos do orquestrador."""
        self.logger.info("Fechando LLMOrchestrator e seus componentes...")
        try:
            # Cancela a tarefa de manutenção de conexão
            if self._connection_manager_task:
                self._connection_manager_task.cancel()
                try:
                    await self._connection_manager_task
                except asyncio.CancelledError:
                    self.logger.info("Gerenciador de conexões cancelado.")

            # Fecha todos os modelos
            close_model_tasks = []
            for name, model_instance in self.models.items():
                if hasattr(model_instance, 'close') and callable(model_instance.close):
                    close_model_tasks.append(model_instance.close())
                else:
                    self.logger.debug(f"Modelo {name} não possui método 'close'.")
            
            if close_model_tasks:
                await asyncio.gather(*close_model_tasks, return_exceptions=True)
                self.logger.info("Modelos LLM fechados.")
            else:
                self.logger.info("Nenhum modelo LLM precisou de fechamento explícito.")

            # Fecha cache e métricas
            await self.cache.close()
            await self.metrics.close()
            
            self.logger.info("LLMOrchestrator e seus componentes fechados com sucesso.")
            
        except Exception as e:
            self.logger.critical(f"Erro fatal ao fechar LLMOrchestrator: {str(e)}", exc_info=True)
            raise # Re-lança para que o problema seja visível na camada superior

    @asynccontextmanager
    async def managed_session(self):
        """Context manager para uso seguro do orquestrador, incluindo inicialização e fechamento."""
        await self.initialize() # Inicializa o orquestrador ao entrar no contexto
        try:
            yield self
        finally:
            await self.close() # Garante que os recursos são liberados ao sair do contexto


# --- Exemplo de Uso Completo (Função main para testes) ---
async def main():
    """Exemplo de uso do LLMOrchestrator."""
    # Configurações para o orquestrador (podem vir de um arquivo .env ou config)
    orchestrator_config = {
        "circuit_breaker_threshold": 2, # Reduzido para testes (falha após 2 erros)
        "circuit_breaker_open_duration": 10, # Circuito aberto por 10 segundos
        "rate_limit_max_requests": 5, # 5 requisições a cada 10 segundos
        "rate_limit_window": 10,
        "default_timeout": 30.0, # Timeout padrão para modelos
        "connection_maintain_interval": 10, # Ping a cada 10s para teste rápido
        "enable_cache": True # Habilita o cache para teste
    }
    
    # Criar uma instância do orquestrador
    orchestrator = LLMOrchestrator(orchestrator_config)

    # Usar o orquestrador dentro de um contexto gerenciado (chama initialize e close automaticamente)
    async with orchestrator.managed_session():
        print("\n--- Teste 1: Requisição bem-sucedida ---")
        try:
            response = await orchestrator.generate(
                query="Qual é a capital de Moçambique?",
                context=ContextType.GENERAL.value, # Usar o Enum
                jurisdiction="MZ",
                user_id="user_A",
                min_confidence=0.7 # Confiança esperada 0.0-1.0
            )
            print(f"Status: {response.status}")
            print(f"Resposta: {response.text}")
            print(f"Confiança: {response.confidence:.2f}")
            print(f"Fontes: {response.sources}")
            print(f"Modelos Usados (Consenso): {response.models_used}")
            print(f"Tempo de Processamento: {response.processing_time:.2f}s")
            print(f"Raciocínio: {response.reasoning}")
            print(f"Cached: {response.cached}")
            print("-" * 30)
        except Exception as e:
            print(f"Erro: {e}")
            print("-" * 30)

        print("\n--- Teste 2: Requisição do Cache ---")
        try:
            response = await orchestrator.generate(
                query="Qual é a capital de Moçambique?", # Mesma query para hit no cache
                context=ContextType.GENERAL.value, 
                jurisdiction="MZ",
                user_id="user_A",
                min_confidence=0.7
            )
            print(f"Status: {response.status}")
            print(f"Resposta: {response.text}")
            print(f"Confiança: {response.confidence:.2f}")
            print(f"Cached: {response.cached}")
            print(f"Tempo de Processamento: {response.processing_time:.2f}s (esperado ser rápido)")
            print("-" * 30)
        except Exception as e:
            print(f"Erro: {e}")
            print("-" * 30)


        print("\n--- Teste 3: Ativação do Rate Limiter ---")
        # 5 requisições permitidas em 10s. A 6ª deve falhar.
        for i in range(7):
            try:
                print(f"Tentativa de requisição {i+1} para user_B (rate limit)...")
                response = await orchestrator.generate(
                    query="Me fale sobre a história de Tete.",
                    context=ContextType.GENERAL.value,
                    jurisdiction="MZ",
                    user_id="user_B",
                    min_confidence=0.5
                )
                print(f"  Status: {response.status}, Resposta: {response.text[:50]}...")
            except Exception as e:
                print(f"  Erro (Rate Limit): {e}")
        
        print(f"\nEsperando {orchestrator_config['rate_limit_window'] + 1}s para resetar o Rate Limiter...")
        await asyncio.sleep(orchestrator_config["rate_limit_window"] + 1)
        print("-" * 30)

        print("\n--- Teste 4: Ativação e Reset do Circuit Breaker (Simulando falhas do OllamaLLM) ---")
        # A simulação de erro no OllamaLLM para "Samora" será ativada aqui
        # O threshold é 2, então 2 falhas ativam o CB.
        for i in range(4): # 2 falhas para abrir, 1 para tentar com CB aberto, 1 após reset
            print(f"Tentativa de requisição {i+1} (circuit breaker test - OllamaLLM)...")
            try:
                response = await orchestrator.generate(
                    query="Quem foi Samora Machel?", # Esta query ativa a falha simulada no OllamaLLM
                    context=ContextType.GENERAL.value,
                    jurisdiction="MZ",
                    user_id="user_C",
                    min_confidence=0.5
                )
                print(f"  Status: {response.status}, Resposta: {response.text[:50]}...")
            except Exception as e:
                print(f"  Erro (Circuit Breaker): {e}")
            await asyncio.sleep(1) # Pequeno delay para ver o circuit breaker em ação

        print(f"\nEsperando {orchestrator_config['circuit_breaker_open_duration'] + 1}s para resetar o Circuit Breaker...")
        await asyncio.sleep(orchestrator_config["circuit_breaker_open_duration"] + 1)

        print("\n--- Teste 5: Requisição após reset do Circuit Breaker ---")
        # Após o reset, a primeira tentativa deve ser bem-sucedida (se o modelo se recuperou)
        try:
            response = await orchestrator.generate(
                query="Qual a moeda de Moçambique?",
                context=ContextType.GENERAL.value,
                jurisdiction="MZ",
                user_id="user_D",
                min_confidence=0.7
            )
            print(f"Status: {response.status}")
            print(f"Resposta: {response.text}")
            print(f"Confiança: {response.confidence:.2f}")
            print(f"Modelos Usados: {response.models_used}")
        except Exception as e:
            print(f"Erro: {e}")
        print("-" * 30)

        print("\n--- Teste 6: Baixa Confiança da Resposta / Falha de Consenso ---")
        # Simulando um cenário onde a confiança final seria muito baixa
        original_consensus_min_agreement = orchestrator.consensus_engine.min_agreement
        orchestrator.consensus_engine.min_agreement = 0.95 # Aumenta o requisito de similaridade para forçar falha de consenso

        try:
            response = await orchestrator.generate(
                query="Fale sobre a culinária de Moçambique e a história da agricultura romana.", # Query que pode gerar respostas divergentes
                context=ContextType.GENERAL.value,
                jurisdiction="MZ",
                min_confidence=0.9 # Exige alta confiança
            )
            print(f"Status: {response.status}")
            print(f"Resposta: {response.text[:50]}...")
            print(f"Confiança: {response.confidence:.2f}")
        except Exception as e:
            print(f"Erro (Baixa Confiança/Consenso): {e}")
        finally:
            orchestrator.consensus_engine.min_agreement = original_consensus_min_agreement # Restaura

        print("-" * 30)

        print("\n--- Teste 7: Verificação de Health Status ---")
        health_status = await orchestrator.get_health_status()
        print(json.dumps(health_status, indent=2))
        print("-" * 30)


if __name__ == "__main__":
    asyncio.run(main())
