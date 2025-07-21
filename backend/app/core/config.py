"""
Configurações da aplicação.
"""
import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field


class DatabaseSettings(BaseSettings):
    """Configurações do banco de dados."""
    host: str = Field(default="localhost", env="DB_HOST")
    port: int = Field(default=5432, env="DB_PORT") 
    user: str = Field(default="muzaia_user", env="DB_USER")
    password: str = Field(default="muzaia_password", env="DB_PASSWORD")
    name: str = Field(default="muzaia_db", env="DB_NAME")

    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"


class Settings(BaseSettings):
    """Configurações principais da aplicação."""
    # Aplicação
    PROJECT_NAME: str = "Mozaia Backend API"
    PROJECT_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=True, env="DEBUG")
    APP_NAME: str = Field(default="Mozaia LLM Orchestrator", env="APP_NAME")
    APP_VERSION: str = Field(default="2.0.0", env="APP_VERSION")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")

    # Servidor
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")

    # Banco de dados
    database: DatabaseSettings = DatabaseSettings()
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./mozaia.db", env="DATABASE_URL")

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(default=["*"], env="ALLOWED_ORIGINS")

    # JWT
    SECRET_KEY: str = Field(default="development-secret-key", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")

    # Ollama
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    OLLAMA_LLAMA_MODEL: str = Field(default="llama3:8b", env="OLLAMA_LLAMA_MODEL")
    OLLAMA_GEMMA_MODEL: str = Field(default="gemma2:9b", env="OLLAMA_GEMMA_MODEL")

    # OpenRouter
    OPENROUTER_QWEN_MODEL: str = Field(default="qwen/qwen-2.5-72b-instruct", env="OPENROUTER_QWEN_MODEL")

    # Cohere
    COHERE_MODEL: str = Field(default="command-r-plus", env="COHERE_MODEL")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()