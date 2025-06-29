# -*- coding: utf-8 -*-
"""
Configuração global dos testes.

Define fixtures e configurações compartilhadas
entre todos os testes da aplicação.
"""
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

# Importar app principal
from main import app
from app.core.config import settings
from app.database.connection import db_manager

@pytest.fixture(scope="session")
def event_loop():
    """Event loop para testes assíncronos."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture
async def async_client():
    """Cliente HTTP assíncrono para testes."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def client():
    """Cliente de teste síncrono."""
    return TestClient(app)

@pytest.fixture
def mock_orchestrator():
    """Mock do orquestrador para testes."""
    mock = AsyncMock()
    mock.generate.return_value = MagicMock(
        response="Resposta de teste",
        confidence=0.8,
        model_responses=[],
        consensus_score=0.8,
        processing_time=1.0,
        total_tokens=100,
        total_cost=0.01,
        requires_review=False,
        context_used="general",
        metadata={}
    )
    return mock

@pytest.fixture
def mock_pool():
    """Mock do pool para testes."""
    mock = AsyncMock()
    mock.get_stats.return_value = {}
    mock.get_global_metrics.return_value = {
        "total_instances": 5,
        "available_instances": 3
    }
    return mock

@pytest.fixture
def mock_factory():
    """Mock da factory para testes."""
    mock = MagicMock()
    mock.get_available_models.return_value = [
        "llama3:8b", 
        "gemma2:9b", 
        "qwen/qwen-2.5-72b-instruct"
    ]
    mock.get_provider_info.return_value = {
        "ollama": {"models": ["llama3:8b", "gemma2:9b"]},
        "openrouter": {"models": ["qwen/qwen-2.5-72b-instruct"]}
    }
    return mock

@pytest.fixture
def sample_generation_request():
    """Dados de exemplo para requisição de geração."""
    return {
        "query": "Como implementar autenticação em FastAPI?",
        "context": "technical", 
        "user_id": "test_user_123",
        "min_confidence": 0.7,
        "params": {
            "temperature": 0.7,
            "max_tokens": 1000
        }
    }

@pytest.fixture
def sample_llm_response():
    """Resposta de exemplo de um modelo LLM."""
    return {
        "text": "Para implementar autenticação em FastAPI...",
        "model": "llama3:8b",
        "tokens_used": 150,
        "processing_time": 2.5,
        "cost": 0.0,
        "error": None,
        "metadata": {
            "provider": "ollama"
        }
    }

@pytest.fixture(autouse=True)
def override_settings():
    """Override configurações para testes."""
    settings.debug = True
    settings.environment = "test"
    settings.database.url = "sqlite+aiosqlite:///:memory:"
    
    # Mock external services
    settings.models.ollama_base_url = "http://localhost:11434"
    settings.models.openrouter_api_key = "test_key"
    settings.models.cohere_api_key = "test_key"

# Markers para categorizar testes
def pytest_configure(config):
    """Configurar markers customizados."""
    config.addinivalue_line(
        "markers", "unit: marca testes unitários"
    )
    config.addinivalue_line(
        "markers", "integration: marca testes de integração"
    )
    config.addinivalue_line(
        "markers", "slow: marca testes lentos"
    )
    config.addinivalue_line(
        "markers", "external: marca testes que dependem de serviços externos"
    )
