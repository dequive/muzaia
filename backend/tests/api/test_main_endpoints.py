# backend/tests/api/test_main_endpoints.py
from fastapi import status
from fastapi.testclient import TestClient

# Testes são funções que começam com 'test_'
# A fixture 'client' é injetada automaticamente pelo pytest.

def test_health_check(client: TestClient):
    """
    Testa se o endpoint /health está funcionando e retornando o status correto.
    """
    # Dado (Given): O cliente da API está pronto.
    
    # Quando (When): Uma requisição GET é feita para /health.
    response = client.get("/health")
    
    # Então (Then): A resposta deve ser bem-sucedida.
    assert response.status_code == status.HTTP_200_OK
    
    # E o corpo da resposta deve conter o status esperado.
    response_json = response.json()
    assert response_json["status"] == "ok"
    assert response_json["dependencies"][0]["name"] == "database"
    assert response_json["dependencies"][0]["status"] == "ok"

def test_metrics_endpoint(client: TestClient):
    """
    Testa se o endpoint /metrics está expondo as métricas do Prometheus.
    """
    # Quando uma requisição GET é feita para /metrics
    response = client.get("/metrics")
    
    # Então a resposta deve ser bem-sucedida
    assert response.status_code == status.HTTP_200_OK
    
    # E o conteúdo deve conter os nomes das nossas métricas
    content = response.text
    assert "http_requests_total" in content
    assert "http_requests_duration_seconds" in content
    assert "http_requests_in_progress" in content

def test_generate_endpoint_success(client: TestClient, mocker):
    """
    Testa o sucesso do endpoint /v1/generate, usando um mock para o orquestrador.
    """
    # Dado (Given): Um mock para o LLMOrchestrator para não fazer chamadas reais.
    # O 'mocker' é uma fixture do plugin pytest-mock.
    mock_orchestrator = mocker.patch(
        "app.main.LLMOrchestrator.generate", 
        return_value={"result": "This is a test response."}
    )
    
    # E um payload válido para a requisição
    payload = {
        "prompt": "Hello, world!",
        "model": "test-model"
    }

    # Quando (When): Uma requisição POST é feita para /v1/generate
    response = client.post("/v1/generate", json=payload)
    
    # Então (Then): A resposta deve ser bem-sucedida
    assert response.status_code == status.HTTP_200_OK
    
    # E o orquestrador deve ter sido chamado com os parâmetros corretos
    mock_orchestrator.assert_called_once()
    
    # E a resposta deve conter o resultado do mock
    assert response.json()["result"] == "This is a test response."

def test_generate_endpoint_validation_error(client: TestClient):
    """
    Testa se o endpoint /v1/generate retorna um erro de validação para um payload inválido.
    """
    # Dado um payload inválido (sem o campo 'prompt')
    invalid_payload = {
        "model": "test-model"
    }
    
    # Quando uma requisição POST é feita
    response = client.post("/v1/generate", json=invalid_payload)
    
    # Então a resposta deve ser 422 Unprocessable Entity
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
