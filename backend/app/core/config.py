
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
    max_size: int = 1000


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
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    anthropic_base_url: str = "https://api.anthropic.com"
    
    # Google Gemini
    google_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro-latest"
    gemini_base_url: str = "https://generativelanguage.googleapis.com"


class Settings(BaseSettings):
    """Configurações principais da aplicação."""
    
    # Informações básicas da aplicação
    PROJECT_NAME: str = "Mozaia Backend API"
    PROJECT_VERSION: str = "1.0.0"
    PROJECT_DESCRIPTION: str = "API para sistema de chat híbrido com IA e técnicos"
    
    # Configurações do servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5000",
        "https://localhost:5000",
        "*"  # Para desenvolvimento - remover em produção
    ]
    
    # Configurações específicas
    cache: CacheSettings = CacheSettings()
    database: DatabaseSettings = DatabaseSettings()
    security: SecuritySettings = SecuritySettings()
    llm: LLMSettings = LLMSettings()
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Criar instância das configurações
settings = Settings()
