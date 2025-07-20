
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
import structlog

from app.core.config import settings
from app.core.exceptions import MuzaiaError

logger = structlog.get_logger(__name__)

api_router = APIRouter()

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "muzaia-backend"}

@api_router.get("/models")
async def list_models():
    """List available models"""
    try:
        # Aqui você implementaria a lógica para listar modelos
        return {
            "models": [
                {"name": "gpt-3.5-turbo", "provider": "openai", "status": "available"},
                {"name": "claude-2", "provider": "anthropic", "status": "available"}
            ]
        }
    except Exception as e:
        logger.error("Error listing models", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/metrics")
async def get_metrics():
    """Get system metrics"""
    try:
        return {
            "requests_total": 0,
            "active_models": 2,
            "uptime": "0h 0m 0s"
        }
    except Exception as e:
        logger.error("Error getting metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
