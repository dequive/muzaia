# -*- coding: utf-8 -*-
"""
Configurações da aplicação Mozaia LLM Orchestrator.

As configurações são carregadas com a seguinte precedência:
1. Variáveis de ambiente (ex: MOZAIA_MODELS__OPENROUTER_API_KEY=...)
2. Valores no ficheiro .env na raiz do projeto
3. Valores padrão definidos neste ficheiro
"""

import logging
from typing import Literal

from pydantic import (
    Field,
    SecretStr,
    ValidationError,
    HttpUrl,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict

log = logging.getLogger(__name__)

class ModelSettings(BaseSettings):
    """Configurações específicas para os modelos de linguagem (LLMs)."""
    # Ollama
    ollama_llama_model: str = Field("llama3:8b", description="Modelo Llama a ser usado via Ollama.")
    ollama_gemma_model: str = Field("gemma2:9b", description="Modelo Gemma a ser usado via Ollama.")
    ollama_base_url: HttpUrl = Field("http://localhost:11434", description="URL base da API do serviço Ollama.")

    # OpenRouter
    openrouter_qwen_model: str = Field("qwen/qwen-2.5-72b-instruct", description="Modelo Qwen a ser usado via OpenRouter.")
    openrouter_api_key: SecretStr = Field(..., description="Chave de API para o serviço OpenRouter (obrigatória).")

    # Cohere
    cohere_api_key: SecretStr = Field(..., description="Chave de API para o serviço Cohere (obrigatória).")

class OrchestratorSettings(BaseSettings):
    """Configurações para o comportamento do orquestrador."""
    max_query_length: int = Field(4000, ge=100, le=10000, description="Comprimento máximo (em caracteres) de uma consulta.")
    default_model_timeout_sec: int = Field(30, ge=5, le=300, description="Timeout padrão para chamadas a modelos (em segundos).")
    default_model_retries: int = Field(2, ge=0, le=5, description="Número de retentativas padrão em caso de falha de um modelo.")

class ResilienceSettings(BaseSettings):
    """Configurações para os padrões de resiliência (Circuit Breaker, Rate Limiter)."""
    circuit_breaker_threshold: int = Field(3, ge=1, description="Número de falhas consecutivas para abrir o Circuit Breaker.")
    circuit_breaker_reset_sec: int = Field(60, ge=10, description="Tempo (em segundos) para o Circuit Breaker tentar fechar.")
    rate_limit_max_calls: int = Field(100, ge=1, description="Número máximo de chamadas permitidas por período de tempo.")
    rate_limit_period_sec: int = Field(60, ge=1, description="Janela de tempo (em segundos) para o Rate Limiter.")

class CacheSettings(BaseSettings):
    """Configurações para o sistema de cache de respostas."""
    cache_ttl_sec: int = Field(3600, ge=60, description="Tempo de vida (TTL) dos itens no cache (em segundos).")
    cache_max_size: int = Field(1000, ge=10, description="Número máximo de respostas a serem mantidas no cache.")

class AppSettings(BaseSettings):
    """
    Configuração raiz da aplicação que agrega todos os módulos de configuração.
    """
    # Agregação das configurações modulares
    models: ModelSettings = Field(default_factory=ModelSettings)
    orchestrator: OrchestratorSettings = Field(default_factory=OrchestratorSettings)
    resilience: ResilienceSettings = Field(default_factory=ResilienceSettings)
    cache: CacheSettings = Field(default_factory=CacheSettings)

    # Configurações globais da aplicação
    env_state: Literal["dev", "staging", "prod"] = Field("dev", description="Ambiente de execução da aplicação.")
    debug: bool = Field(False, description="Ativa o modo de debug, que pode expor informação sensível.")

    model_config = SettingsConfigDict(
        env_prefix="MOZAIA_",
        env_nested_delimiter="__",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def _override_debug_in_production(self) -> "AppSettings":
        """Garante que o modo debug está sempre desativado em produção por segurança."""
        if self.env_state == "prod" and self.debug:
            log.warning("Ambiente 'prod' detetado. A forçar 'debug=False' por razões de segurança.")
            self.debug = False
        return self

    @property
    def is_production(self) -> bool:
        """Propriedade para verificar facilmente se a aplicação corre em modo de produção."""
        return self.env_state == "prod"

def load_app_settings() -> AppSettings:
    """
    Função singleton para carregar as configurações da aplicação.
    Trata os erros de forma robusta e fornece um fallback seguro para desenvolvimento.
    """
    try:
        settings = AppSettings()
        log.info(f"Configurações carregadas com sucesso para o ambiente: '{settings.env_state}'.")
        if settings.debug:
            # Excluir chaves de API ao imprimir as configurações
            debug_settings = settings.model_dump()
            del debug_settings["models"]["openrouter_api_key"]
            del debug_settings["models"]["cohere_api_key"]
            log.debug("Configurações atuais (excluindo segredos): %s", json.dumps(debug_settings, indent=2))
        return settings
    except ValidationError as e:
        # Usar print aqui é deliberado, pois o logger pode ainda não estar configurado.
        print(f"ERRO CRÍTICO: Erro de validação nas configurações da aplicação.\n{e}")
        raise
    except Exception as e:
        print(f"ERRO CRÍTICO: Falha inesperada ao carregar as configurações.\n{e}")
        raise RuntimeError("Não foi possível inicializar as configurações da aplicação.") from e

# Instância global das configurações, carregada de forma segura.
# Esta é a variável que será importada por outros módulos.
try:
    settings = load_app_settings()
except Exception:
    print("AVISO: A usar configurações de fallback para desenvolvimento devido a erro no carregamento.")
    settings = AppSettings(
        models=ModelSettings(
            openrouter_api_key="dummy_key_dev",
            cohere_api_key="dummy_key_dev",
        ),
        debug=True,
    )
