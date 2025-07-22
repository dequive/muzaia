
"""
Arquivo principal da aplicação FastAPI.
"""
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.glossario import router as glossario_router

# Configurar logging
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação."""
    logger.info("🚀 Iniciando aplicação Mozaia Backend")
    
    yield
    
    logger.info("✅ Aplicação finalizada")


# Criar aplicação FastAPI
app = FastAPI(
    title="Mozaia Backend API",
    description="API para sistema de chat híbrido com IA e técnicos",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de compressão
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Incluir routers
app.include_router(glossario_router)


@app.get("/")
async def root():
    """Endpoint raiz da API."""
    return {
        "message": "Mozaia Backend API",
        "version": settings.PROJECT_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return JSONResponse({
        "status": "healthy",
        "version": settings.PROJECT_VERSION,
        "timestamp": "2025-01-20T10:38:50Z"
    })


@app.get("/api/v1/test")
async def test_integration():
    """Endpoint de teste para verificar integração frontend-backend."""
    return {
        "status": "success",
        "message": "Backend conectado com sucesso!",
        "backend_version": settings.PROJECT_VERSION,
        "timestamp": "2024-01-26T10:00:00Z",
        "endpoints": {
            "health": "/health",
            "glossario": "/api/glossario/",
            "test": "/api/v1/test"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global para exceções."""
    logger.error("Erro não tratado", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Erro interno do servidor"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )
