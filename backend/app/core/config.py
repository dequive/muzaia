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

    # Servidor
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")

    # Banco de dados
    database: DatabaseSettings = DatabaseSettings()

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(default=["*"], env="ALLOWED_ORIGINS")

    # JWT
    SECRET_KEY: str = Field(default="development-secret-key", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()