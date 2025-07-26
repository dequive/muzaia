# -*- coding: utf-8 -*-
"""
Configurações centralizadas da aplicação Muzaia.
"""

import os
from typing import List, Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class CacheSettings(BaseModel):
    """Configurações de cache."""
    enabled: bool = True
    ttl_sec: int = 3600
    cache_ttl_sec: int = 3600  # Alias for compatibility
    max_size: int = 1000
    cache_max_size: int = 1000  # Field that was missing
    cache_compression: bool = True
    cleanup_interval_sec: float = 300.0


class DatabaseSettings(BaseModel):
    """Configurações do banco de dados."""
    url: str = "sqlite:///./muzaia.db"
    echo: bool = False
    pool_size: int = 5
    max_overflow: int = 10


class SecuritySettings(BaseModel):
    """Configurações de segurança."""
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30


class LLMSettings(BaseModel):
    """Configurações para modelos LLM."""
    timeout_seconds: int = 30

    # Anthropic Claude
    anthropic_api_key: str = Field(default="", env="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", env="ANTHROPIC_MODEL")
    anthropic_base_url: str = Field(default="https://api.anthropic.com", env="ANTHROPIC_BASE_URL")

    # Google Gemini
    google_api_key: str = Field(default="", env="GOOGLE_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-pro-latest", env="GEMINI_MODEL")
    gemini_base_url: str = Field(default="https://generativelanguage.googleapis.com", env="GEMINI_BASE_URL")


class Settings(BaseSettings):
    """Configurações principais da aplicação."""

    # Configurações do projeto
    PROJECT_NAME: str = "Mozaia Backend API"
    PROJECT_VERSION: str = "1.0.0"
    DEBUG: bool = False
    NODE_ENV: str = "production"

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALLOWED_HOSTS: list[str] = ["*"]
    CORS_ORIGINS: list[str] = [
        "https://68f4a38c-dc7e-4477-a5d0-2a575a69b246-00-1wr0h8c4r1ujt.spock.replit.dev",
        "https://localhost:5000",
        "https://127.0.0.1:5000"
    ]

    # Informações básicas da aplicação
    APP_NAME: str = "Mozaia LLM Orchestrator"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    # Configurações do servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./mozaia.db"

    # Security
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5000",
        "https://localhost:5000",
        "*"  # Para desenvolvimento - remover em produção
    ]

    # URLs
    BASE_URL: str = "https://68f4a38c-dc7e-4477-a5d0-2a575a69b246-00-1wr0h8c4r1ujt.spock.replit.dev:8000"
    FRONTEND_URL: str = "https://68f4a38c-dc7e-4477-a5d0-2a575a69b246-00-1wr0h8c4r1ujt.spock.replit.dev:5000"

    # JWT
    JWT_SECRET_KEY: str = "your-jwt-secret-key-here"
    JWT_ALGORITHM: str = "HS256"

    # OAuth Google
    GOOGLE_CLIENT_ID: str = "your-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "your-google-client-secret"

    # OAuth Microsoft
    MICROSOFT_CLIENT_ID: str = "your-microsoft-client-id"
    MICROSOFT_CLIENT_SECRET: str = "your-microsoft-client-secret"
    MICROSOFT_TENANT_ID: str = "common"

    # Configurações específicas
    cache: CacheSettings = CacheSettings()
    database: DatabaseSettings = DatabaseSettings()
    security: SecuritySettings = SecuritySettings()
    llm: LLMSettings = LLMSettings()

    # Logging
    LOG_LEVEL: str = "INFO"
    PROJECT_DESCRIPTION: str = "API para sistema de chat híbrido com IA e técnicos"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


# Criar instância das configurações
settings = Settings()