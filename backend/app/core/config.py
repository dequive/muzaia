"""
Configurações da aplicação Mozaia LLM Orchestrator.

As configurações são carregadas na seguinte ordem de precedência:
1. Variáveis de ambiente (com prefixo MOZAIA_)
2. Arquivo .env na raiz do projeto
3. Valores padrão definidos abaixo

Variáveis obrigatórias devem ser definidas no .env ou ambiente.
"""

import logging
from typing import Optional

from pydantic import (
    Field,
    SecretStr,
    ValidationError,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict

# Configuração de logging
logger = logging.getLogger(__name__)

class ModelSettings(BaseSettings):
    """Configurações específicas para modelos LLM."""

    # Ollama
    ollama_llama_model: str = Field(
        default="llama3:8b",
        description="Modelo Ollama Llama (formato 'nome:versão')",
        min_length=3,
    )
    ollama_gemma_model: str = Field(
        default="gemma2:9b",
        description="Modelo Ollama Gemma (formato 'nome:versão')",
        min_length=3,
    )
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        description="URL base da API Ollama",
        pattern=r"^https?://.+$",
    )

    # OpenRouter
    openrouter_qwen_model: str = Field(
        default="qwen/qwen-2.5-72b-instruct",
        description="Modelo Qwen no OpenRouter",
    )
    openrouter_api_key: SecretStr = Field(
        ...,
        description="Chave API OpenRouter (obrigatória)",
    )

    # Cohere
    cohere_api_key: SecretStr = Field(
        ...,
        description="Chave API Cohere (obrigatória)",
    )

    @field_validator("ollama_base_url")
    @classmethod
    def validate_ollama_url(cls, value: str) -> str:
        """Garante que a URL termina sem barra."""
        return value.rstrip("/")

class OrchestratorSettings(BaseSettings):
    """Configurações para o orquestrador de modelos."""

    max_query_length: int = Field(
        default=4000,
        ge=100,
        le=10000,
        description="Comprimento máximo de caracteres para consultas",
    )
    default_model_timeout_sec: int = Field(
        default=30,
        ge=5,
        le=300,
        description="Timeout padrão para requisições a modelos (segundos)",
    )
    default_model_retries: int = Field(
        default=2,
        ge=0,
        le=5,
        description="Tentativas padrão para falhas de modelos",
    )

class ResilienceSettings(BaseSettings):
    """Configurações para resiliência do sistema."""

    circuit_breaker_threshold: int = Field(
        default=3,
        ge=1,
        description="Número de falhas para ativar circuit breaker",
    )
    circuit_breaker_reset_sec: int = Field(
        default=60,
        ge=10,
        description="Tempo para resetar circuit breaker (segundos)",
    )
    rate_limit_max_calls: int = Field(
        default=100,
        ge=1,
        description="Máximo de chamadas por período",
    )
    rate_limit_period_sec: int = Field(
        default=60,
        ge=1,
        description="Período para rate limiting (segundos)",
    )

class CacheSettings(BaseSettings):
    """Configurações de cache."""

    cache_ttl_sec: int = Field(
        default=3600,
        ge=60,
        description="TTL do cache em segundos (1 hora padrão)",
    )
    cache_max_size: int = Field(
        default=1000,
        ge=10,
        description="Máximo de itens no cache",
    )

class AppSettings(BaseSettings):
    """
    Configurações principais da aplicação.

    Combina todas as subconfigurações e adiciona configurações globais.
    """

    # Subconfigurações
    models: ModelSettings = Field(default_factory=ModelSettings)
    orchestrator: OrchestratorSettings = Field(default_factory=OrchestratorSettings)
    resilience: ResilienceSettings = Field(default_factory=ResilienceSettings)
    cache: CacheSettings = Field(default_factory=CacheSettings)

    # Configuração global
    env_state: str = Field(
        default="dev",
        pattern="^(dev|staging|prod)$",
        description="Ambiente de execução",
    )
    debug: bool = Field(
        default=False,
        description="Modo debug (sobrescrito por env_state=prod)",
    )

    model_config = SettingsConfigDict(
        env_prefix="MOZAIA_",
        env_nested_delimiter="__",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @model_validator(mode="after")
    def set_debug_mode(self) -> "AppSettings":
        """Define automaticamente debug=False em produção."""
        if self.env_state == "prod":
            self.debug = False
        return self

    @property
    def is_production(self) -> bool:
        """Verifica se está em ambiente de produção."""
        return self.env_state == "prod"

    @classmethod
    def load_settings(cls) -> "AppSettings":
        """Carrega as configurações com tratamento de erros."""
        try:
            settings = cls()
            logger.info("Configurações carregadas com sucesso")
            if settings.debug:
                logger.debug("Configurações atuais: %s", settings.model_dump_json(indent=2))
            return settings
        except ValidationError as e:
            logger.critical("Erro de validação nas configurações: %s", e)
            raise
        except Exception as e:
            logger.error("Erro ao carregar configurações: %s", e)
            raise RuntimeError("Falha ao carregar configurações") from e

# Carrega as configurações ao importar o módulo
try:
    settings = AppSettings.load_settings()
except Exception:
    # Fallback para desenvolvimento
    logger.warning("Usando configurações de fallback para desenvolvimento")
    settings = AppSettings(
        models=ModelSettings(
            openrouter_api_key=SecretStr("dummy_key"),
            cohere_api_key=SecretStr("dummy_key"),
        ),
        debug=True,
    )
