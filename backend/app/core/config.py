# -*- coding: utf-8 -*-
"""
Configurações centralizadas da aplicação Mozaia.
"""
from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    """Configurações principais da aplicação."""

    # App Settings
    app_name: str = Field("Mozaia LLM Orchestrator", alias="APP_NAME")
    app_version: str = Field("2.0.0", alias="APP_VERSION")
    debug: bool = Field(False, alias="DEBUG")
    environment: str = Field("production", alias="ENVIRONMENT")
    host: str = Field("0.0.0.0", alias="HOST")
    port: int = Field(8000, alias="PORT")

    # Database
    database_url: str = Field(..., alias="DATABASE_URL")

    # Security
    secret_key: str = Field(..., alias="SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # Redis
    redis_url: str = Field("redis://localhost:6379", alias="REDIS_URL")

    # Models
    ollama_base_url: str = Field("http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_llama_model: str = Field("llama3:8b", alias="OLLAMA_LLAMA_MODEL")
    ollama_gemma_model: str = Field("gemma2:9b", alias="OLLAMA_GEMMA_MODEL")
    openrouter_qwen_model: str = Field("qwen/qwen-2.5-72b-instruct", alias="OPENROUTER_QWEN_MODEL")
    cohere_model: str = Field("command-r-plus", alias="COHERE_MODEL")

    # CORS
    allowed_origins: List[str] = Field(
        ["http://localhost:3000", "https://mozaia.mz"], 
        alias="ALLOWED_ORIGINS"
    )

    # API
    api_prefix: str = Field("/api/v1", alias="API_PREFIX")
    project_name: str = Field("Mozaia API", alias="PROJECT_NAME")
    project_version: str = Field("2.0.0", alias="PROJECT_VERSION")

    # LLM Settings
    model_name: str = Field("llama3:8b", alias="MODEL_NAME")
    llm_pool: int = Field(3, alias="LLM_POOL")

    # Server Settings
    reload: bool = Field(True, alias="RELOAD")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    @validator('secret_key')
    def validate_secret_key(cls, v):
        if not v or len(v) < 32:
            raise ValueError('SECRET_KEY deve ter pelo menos 32 caracteres')
        return v

    @validator('environment')
    def validate_environment(cls, v):
        allowed = ['development', 'staging', 'production', 'testing']
        if v not in allowed:
            raise ValueError(f'ENVIRONMENT deve ser um de: {allowed}')
        return v

    @validator('allowed_origins')
    def parse_origins(cls, v):
        if isinstance(v, str):
            # Parse string format like '["url1", "url2"]'
            if v.startswith('[') and v.endswith(']'):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    return [v.strip('[]"\'')]
            return [v]
        return v

    @property
    def is_development(self) -> bool:
        return self.environment == 'development'

    @property
    def is_production(self) -> bool:
        return self.environment == 'production'

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = False


settings = Settings()