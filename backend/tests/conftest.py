# -*- coding: utf-8 -*-
"""Configuração dos testes."""
import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient

from main import app

@pytest.fixture(scope="session")
def event_loop():
    """Event loop para testes assíncronos."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def async_client():
    """Cliente assíncrono para testes."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def client():
    """Cliente de teste síncrono."""
    return TestClient(app)
