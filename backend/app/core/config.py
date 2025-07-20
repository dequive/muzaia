# -*- coding: utf-8 -*-
"""
Configurações centralizadas da aplicação Mozaia.
"""
from typing import List, Optional, Dict, Any
from pydantic import Field, validator
from pydantic_settings import BaseSettings
import os


class DatabaseSettings(BaseSettings):
    """Configurações de banco de dados."""
    url: str = Field(..., alias="DATABASE_URL")
    echo: bool = Field(False, alias="DB_ECHO")
    pool_size: int = Field(20, alias="DB_POOL_SIZE")
    max_overflow: int = Field(30, alias="DB_MAX_OVERFLOW")
    pool_timeout: float = Field(30.0, alias="DB_POOL_TIMEOUT")
    pool_recycle: int = Field(3600, alias="DB_POOL_RECYCLE")
    pool_pre_ping: bool = Field(True, alias="DB_POOL_PRE_PING")

    @validator('url')
    def validate_url(cls, v):
        if not v or not v.startswith(('postgresql://', 'postgresql+asyncpg://', 'sqlite+aiosqlite://')):
            raise ValueError('DATABASE_URL deve ser uma URL válida')
        return v

    class Config:
        protected_namespaces = ('settings_',)


class RedisSettings(BaseSettings):
    """Configurações do Redis."""
    url: str = Field("redis://localhost:6379", alias="REDIS_URL")
    max_connections: int = Field(50, alias="REDIS_MAX_CONNECTIONS")
    retry_on_timeout: bool = Field(True, alias="REDIS_RETRY_ON_TIMEOUT")
    socket_timeout: float = Field(5.0, alias="REDIS_SOCKET_TIMEOUT")
    socket_connect_timeout: float = Field(5.0, alias="REDIS_SOCKET_CONNECT_TIMEOUT")
    health_check_interval: int = Field(30, alias="REDIS_HEALTH_CHECK_INTERVAL")

    @validator('url')
    def validate_url(cls, v):
        if not v or not v.startswith('redis://'):
            raise ValueError('REDIS_URL deve ser uma URL Redis válida')
        return v

    class Config:
        protected_namespaces = ('settings_',)


class CacheSettings(BaseSettings):
    """Configurações de cache."""
    cache_ttl_sec: int = Field(3600, alias="CACHE_TTL_SEC")
    cache_max_size: int = Field(50000, alias="CACHE_MAX_SIZE")
    enable_response_caching: bool = Field(True, alias="ENABLE_RESPONSE_CACHING")
    cleanup_interval_sec: int = Field(300, alias="CACHE_CLEANUP_INTERVAL_SEC")
    cache_compression: bool = Field(True, alias="CACHE_COMPRESSION")
    cache_compression_level: int = Field(6, alias="CACHE_COMPRESSION_LEVEL")

    conversation_cache_ttl: int = Field(7200, alias="CONVERSATION_CACHE_TTL")
    llm_cache_ttl: int = Field(1800, alias="MODEL_CACHE_TTL")
    user_cache_ttl: int = Field(3600, alias="USER_CACHE_TTL")

    class Config:
        protected_namespaces = ('settings_',)


class ModelsSettings(BaseSettings):
    """Configurações dos modelos LLM."""
    ollama_base_url: str = Field("http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_llama_model: str = Field("llama3:8b", alias="OLLAMA_LLAMA_MODEL")
    ollama_gemma_model: str = Field("gemma2:9b", alias="OLLAMA_GEMMA_MODEL")
    ollama_timeout: float = Field(120.0, alias="OLLAMA_TIMEOUT")

    openrouter_api_key: Optional[str] = Field(None, alias="OPENROUTER_API_KEY")
    openrouter_qwen_model: str = Field("qwen/qwen-2.5-72b-instruct", alias="OPENROUTER_QWEN_MODEL")
    openrouter_timeout: float = Field(60.0, alias="OPENROUTER_TIMEOUT")

    cohere_api_key: Optional[str] = Field(None, alias="COHERE_API_KEY")
    cohere_model: str = Field("command-r-plus", alias="COHERE_MODEL")
    cohere_timeout: float = Field(60.0, alias="COHERE_TIMEOUT")

    default_max_tokens: int = Field(4096, alias="DEFAULT_MAX_TOKENS")
    default_temperature: float = Field(0.7, alias="DEFAULT_TEMPERATURE")
    llm_retry_attempts: int = Field(3, alias="MODEL_RETRY_ATTEMPTS")
    llm_retry_delay: float = Field(1.0, alias="MODEL_RETRY_DELAY")

    class Config:
        protected_namespaces = ('settings_',)


class SecuritySettings(BaseSettings):
    """Configurações de segurança."""
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    allowed_origins: List[str] = Field(
        ["http://localhost:3000", "https://mozaia.mz"], 
        alias="ALLOWED_ORIGINS"
    )
    allowed_methods: List[str] = Field(["GET", "POST", "PUT", "DELETE"], alias="ALLOWED_METHODS")
    allowed_headers: List[str] = Field(["*"], alias="ALLOWED_HEADERS")
    allow_credentials: bool = Field(True, alias="ALLOW_CREDENTIALS")

    rate_limit_requests: int = Field(100, alias="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(60, alias="RATE_LIMIT_WINDOW")

    @validator('secret_key')
    def validate_secret_key(cls, v):
        if not v or len(v) < 32:
            raise ValueError('SECRET_KEY deve ter pelo menos 32 caracteres')
        return v

    @validator('allowed_origins')
    def validate_origins(cls, v):
        if "*" in v and len(v) > 1:
            raise ValueError('Se usar "*", deve ser o único valor em allowed_origins')
        return v

    class Config:
        protected_namespaces = ('settings_',)


class AppSettings(BaseSettings):
    """Configurações principais da aplicação."""
    app_name: str = Field("Mozaia LLM Orchestrator", alias="APP_NAME")
    app_version: str = Field("2.0.0", alias="APP_VERSION")
    app_description: str = Field(
        "Orquestrador enterprise para múltiplos LLMs",
        alias="APP_DESCRIPTION"
    )

    debug: bool = Field(False, alias="DEBUG")
    environment: str = Field("production", alias="ENVIRONMENT")
    testing: bool = Field(False, alias="TESTING")

    host: str = Field("0.0.0.0", alias="HOST")
    port: int = Field(8000, alias="PORT")
    workers: int = Field(1, alias="WORKERS")

    base_url: str = Field("https://api.mozaia.mz", alias="BASE_URL")
    frontend_url: str = Field("https://mozaia.mz", alias="FRONTEND_URL")
    docs_url: str = Field("/docs", alias="DOCS_URL")

    log_level: str = Field("INFO", alias="LOG_LEVEL")
    log_format: str = Field("json", alias="LOG_FORMAT")
    log_file: Optional[str] = Field(None, alias="LOG_FILE")

    @validator('environment')
    def validate_environment(cls, v):
        allowed = ['development', 'staging', 'production', 'testing']
        if v not in allowed:
            raise ValueError(f'ENVIRONMENT deve ser um de: {allowed}')
        return v

    @validator('log_level')
    def validate_log_level(cls, v):
        allowed = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in allowed:
            raise ValueError(f'LOG_LEVEL deve ser um de: {allowed}')
        return v.upper()

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = False
        protected_namespaces = ('settings_',)


class Settings(BaseSettings):
    """Configurações completas da aplicação."""

    app: AppSettings = AppSettings()
    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    cache: CacheSettings = CacheSettings()
    models: ModelsSettings = ModelsSettings()
    security: SecuritySettings = SecuritySettings()

    @property
    def is_development(self) -> bool:
        return self.app.environment == 'development'

    @property
    def is_production(self) -> bool:
        return self.app.environment == 'production'

    class Config:
        protected_namespaces = ('settings_',)


settings = Settings()