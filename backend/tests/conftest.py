# backend/tests/conftest.py
import asyncio
from typing import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database.models import Base
from app.database.session import get_db_session
from app.main import app
from app.core.config import settings

# Cria um engine SQLAlchemy síncrono para o banco de dados de teste SQLite.
engine = create_async_engine(settings.database.url, echo=True)
TestingSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

# --- Fixtures do Pytest ---

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Cria um event loop para a sessão de testes inteira."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function", autouse=True)
async def setup_database():
    """
    Fixture para criar e limpar o banco de dados de teste para cada teste.
    'autouse=True' garante que seja executado automaticamente.
    """
    async with engine.begin() as conn:
        # Cria todas as tabelas antes de cada teste.
        await conn.run_sync(Base.metadata.create_all)
    
    yield  # O teste é executado aqui.
    
    async with engine.begin() as conn:
        # Apaga todas as tabelas após cada teste.
        await conn.run_sync(Base.metadata.drop_all)

async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependência de override para usar o banco de dados de teste
    em vez do banco de dados de produção/desenvolvimento.
    """
    async with TestingSessionLocal() as session:
        yield session

@pytest.fixture(scope="function")
def client() -> TestClient:
    """
    Cria uma instância do TestClient do FastAPI que usa o banco de dados de teste.
    """
    # Sobrescreve a dependência get_db_session pela nossa versão de teste.
    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as test_client:
        yield test_client
    # Limpa o override após o teste.
    app.dependency_overrides.clear()
