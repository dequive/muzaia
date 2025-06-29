# -*- coding: utf-8 -*-
"""
Configurações centralizadas da aplicação.
"""
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Configurações de banco de dados."""
    url: str = Field(..., alias="DATABASE_URL")
    echo: bool = False
    pool_size: int = 5
    max_overflow: int = 10


class RedisSettings(BaseSettings):
    """Configurações do Redis."""
    url: str = Field("redis://localhost:6379", alias="REDIS_URL")
    max_connections: int = 20
    retry_on_timeout: bool = True


class ModelsSettings(BaseSettings):
    """Configurações dos modelos LLM."""
    ollama_base_url: str = Field("http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_llama_model: str = "llama3:8b"
    ollama_gemma_model: str = "gemma2:9b"
    openrouter_api_key: Optional[str] = Field(None, alias="OPENROUTER_API_KEY")
    openrouter_qwen_model: str = "qwen/qwen-2.5-72b-instruct"
    cohere_api_key: Optional[str] = Field(None, alias="COHERE_API_KEY")
    cohere_model: str = "command-r-plus"


class OrchestratorSettings(BaseSettings):
    """Configurações do orquestrador."""
    max_query_length: int = 2000
    default_min_confidence: float = 0.65
    consensus_threshold: float = 0.7
    max_retries: int = 3
    request_timeout: float = 60.0


class PoolSettings(BaseSettings):
    """Configurações do pool de LLMs."""
    max_size: int = 10
    min_size: int = 2
    idle_timeout_sec: float = 300.0
    warmup_size: int = 2
    health_check_interval: float = 60.0
    max_acquisition_wait: float = 30.0


class HTTPSettings(BaseSettings):
    """Configurações HTTP."""
    max_connections: int = 100
    max_connections_per_host: int = 30
    total_timeout: float = 60.0
    connect_timeout: float = 10.0


class AppSettings(BaseSettings):
    """Configurações principais da aplicação."""
    app_name: str = "Mozaia LLM Orchestrator"
    app_version: str = "2.0.0"
    debug: bool = Field(False, alias="DEBUG")
    environment: str = Field("production", alias="ENVIRONMENT")
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # URLs permitidas para CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"],
        alias="CORS_ORIGINS"
    )
    
    # Configurações de segurança
    secret_key: str = Field(..., alias="SECRET_KEY")
    access_token_expire_minutes: int = 30
    
    # Supabase
    supabase_url: Optional[str] = Field(None, alias="SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(None, alias="SUPABASE_ANON_KEY")
    
    # Configurações aninhadas
    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    models: ModelsSettings = ModelsSettings()
    orchestrator: OrchestratorSettings = OrchestratorSettings()
    pool: PoolSettings = PoolSettings()
    http: HTTPSettings = HTTPSettings()

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Instância global das configurações
settings = AppSettings()
