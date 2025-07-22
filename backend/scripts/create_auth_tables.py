
"""
Script para criar tabelas de autenticação.
"""
import asyncio
import asyncpg
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
import structlog

from app.core.config import settings
from app.database.models import Base
from app.models.auth import User, UserSession, OAuthState

logger = structlog.get_logger(__name__)

async def create_auth_tables():
    """Cria as tabelas de autenticação."""
    try:
        # Criar engine
        engine = create_async_engine(settings.DATABASE_URL, echo=True)
        
        # Criar todas as tabelas
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Tabelas de autenticação criadas com sucesso")
        
    except Exception as e:
        logger.error("Erro ao criar tabelas de autenticação", error=str(e))
        raise

if __name__ == "__main__":
    asyncio.run(create_auth_tables())
