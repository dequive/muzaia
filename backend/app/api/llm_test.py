
# -*- coding: utf-8 -*-
"""
Endpoints de teste para modelos LLM.

Permite testar Claude 3.5 Sonnet e Gemini Pro 1.5 diretamente.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.factory import LLMFactory
from app.schemas import GenerationParams
import aiohttp
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/llm", tags=["LLM Testing"])


class LLMTestRequest(BaseModel):
    """Request para teste de LLM."""
    model: str
    prompt: str
    context: str = ""
    system_prompt: Optional[str] = None
    stream: bool = False
    params: Optional[GenerationParams] = None


class LLMTestResponse(BaseModel):
    """Response do teste de LLM."""
    success: bool
    content: str = ""
    model: str
    provider: str
    tokens_used: Optional[int] = None
    cost: Optional[float] = None
    processing_time: float
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}


async def get_llm_factory():
    """Dependency para obter factory LLM."""
    session = aiohttp.ClientSession()
    try:
        factory = LLMFactory(session)
        yield factory
    finally:
        await session.close()


@router.post("/test", response_model=LLMTestResponse)
async def test_llm(
    request: LLMTestRequest,
    factory: LLMFactory = Depends(get_llm_factory)
):
    """
    Testa um modelo LLM específico.
    
    Modelos disponíveis:
    - claude-3-5-sonnet-20241022 (Claude 3.5 Sonnet)
    - gemini-1.5-pro-latest (Gemini Pro 1.5)
    """
    import time
    start_time = time.time()
    
    try:
        # Criar instância do modelo
        llm = await factory.create_llm(request.model, request.params.dict() if request.params else None)
        
        # Gerar resposta
        response = await llm.generate(
            prompt=request.prompt,
            context=request.context,
            system_prompt=request.system_prompt,
            params=request.params
        )
        
        processing_time = time.time() - start_time
        
        return LLMTestResponse(
            success=True,
            content=response.content,
            model=response.model,
            provider=response.provider,
            tokens_used=response.tokens_used,
            cost=response.cost,
            processing_time=processing_time,
            metadata=response.metadata or {}
        )
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Erro no teste LLM {request.model}: {str(e)}")
        
        return LLMTestResponse(
            success=False,
            model=request.model,
            provider="unknown",
            processing_time=processing_time,
            error=str(e)
        )


@router.get("/models")
async def list_available_models(factory: LLMFactory = Depends(get_llm_factory)):
    """Lista modelos LLM disponíveis."""
    try:
        models = factory.get_available_models()
        provider_info = factory.get_provider_info()
        
        return {
            "success": True,
            "available_models": models,
            "providers": provider_info,
            "recommended": {
                "primary": "claude-3-5-sonnet-20241022",
                "fallback": "gemini-1.5-pro-latest"
            }
        }
    except Exception as e:
        logger.error(f"Erro ao listar modelos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check_models(factory: LLMFactory = Depends(get_llm_factory)):
    """Verifica saúde de todos os modelos disponíveis."""
    models_to_check = [
        "claude-3-5-sonnet-20241022",
        "gemini-1.5-pro-latest"
    ]
    
    results = {}
    
    for model_name in models_to_check:
        try:
            # Validar se o modelo pode ser criado
            is_valid = await factory.validate_model(model_name)
            
            if is_valid:
                # Criar instância e fazer health check
                llm = await factory.create_llm(model_name)
                is_healthy = await llm.health_check()
                await llm.close()
                
                results[model_name] = {
                    "available": True,
                    "healthy": is_healthy,
                    "status": "ok" if is_healthy else "unhealthy"
                }
            else:
                results[model_name] = {
                    "available": False,
                    "healthy": False,
                    "status": "unavailable"
                }
                
        except Exception as e:
            results[model_name] = {
                "available": False,
                "healthy": False,
                "status": "error",
                "error": str(e)
            }
    
    overall_healthy = any(result.get("healthy", False) for result in results.values())
    
    return {
        "success": True,
        "overall_healthy": overall_healthy,
        "models": results,
        "timestamp": time.time()
    }


# Exemplo de uso
@router.post("/quick-test")
async def quick_test(factory: LLMFactory = Depends(get_llm_factory)):
    """Teste rápido com ambos os modelos."""
    test_prompt = "Explique brevemente o que é direito constitucional."
    
    results = {}
    
    for model_name in ["claude-3-5-sonnet-20241022", "gemini-1.5-pro-latest"]:
        try:
            llm = await factory.create_llm(model_name)
            response = await llm.generate(
                prompt=test_prompt,
                system_prompt="Você é um assistente jurídico especializado."
            )
            await llm.close()
            
            results[model_name] = {
                "success": True,
                "content": response.content[:200] + "..." if len(response.content) > 200 else response.content,
                "tokens": response.tokens_used,
                "cost": response.cost
            }
            
        except Exception as e:
            results[model_name] = {
                "success": False,
                "error": str(e)
            }
    
    return {
        "test_prompt": test_prompt,
        "results": results
    }
