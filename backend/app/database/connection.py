# -*- coding: utf-8 -*-
"""
Gerenciamento de conexão com banco de dados.
"""
import logging
from typing import Optional, AsyncGenerator
from contextlib import asynccontextmanager

import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.engine.events import event

from app.core.config import settings
from app.database.models import Base

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Gerenciador de conexão com banco de dados."""
    
    def __init__(self):
        self._engine: Optional[object] = None
        self._session_factory: Optional[async_sessionmaker] = None
        self._initialized = False

    async def initialize(self) -> None:
        """Inicializa conexão com banco de dados."""
        if self._initialized:
            return

        try:
            # Criar engine com configurações otimizadas
            self._engine = create_async_engine(
                settings.database.url,
                echo=settings.debug,
                pool_size=settings.database.pool_size,
                max_overflow=settings.database.max_overflow,
                pool_pre_ping=True,
                pool_recycle=3600,  # 1 hora
                poolclass=NullPool if settings.environment == "test" else None
            )

            # Configurar session factory
            self._session_factory = async_sessionmaker(
                bind=self._engine,
                class_=AsyncSession,
                expire_on_commit=False
            )

            # Configurar listeners para logging
            if settings.debug:
                self._setup_query_logging()

            # Testar conexão
            await self._test_connection()
            
            self._initialized = True
            logger.info("✅ Conexão com banco de dados inicializada")

        except Exception as e:
            logger.error(f"❌ Erro ao inicializar banco de dados: {e}")
            raise

    def _setup_query_logging(self):
        """Configura logging de queries SQL."""
        @event.listens_for(self._engine.sync_engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            if statement.strip().upper().startswith(('SELECT', 'INSERT', 'UPDATE', 'DELETE')):
                logger.debug(f"SQL Query: {statement[:200]}...")

    async def _test_connection(self) -> None:
        """Testa conexão com o banco."""
        async with self._engine.begin() as conn:
            result = await conn.execute("SELECT 1")
            assert result.scalar() == 1

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Context manager para obter sessão do banco."""
        if not self._initialized:
            await self.initialize()

        async with self._session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def close(self) -> None:
        """Fecha conexões com banco de dados."""
        if self._engine:
            await self._engine.dispose()
            logger.info("Conexões com banco de dados fechadas")

    @property
    def engine(self):
        """Retorna engine do banco."""
        return self._engine

    @property
    def session_factory(self):
        """Retorna session factory."""
        return self._session_factory


# Instância global do gerenciador
db_manager = DatabaseManager()


async def get_db_session():
    """Dependency para obter sessão do banco de dados."""
    async with db_manager.get_session() as session:
        yield session


async def init_db():
    """Inicializa o banco de dados."""
    await db_manager.initialize()


async def close_db():
    """Fecha conexões do banco de dados."""
    await db_manager.close()
