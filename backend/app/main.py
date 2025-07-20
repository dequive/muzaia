
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
from app.database.connection import init_db, close_db
from app.api.router import api_router

# Configurar logging
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação."""
    logger.info("🚀 Iniciando aplicação Mozaia Backend")
    
    # Inicializar banco de dados
    try:
        await init_db()
        logger.info("✅ Banco de dados inicializado")
    except Exception as e:
        logger.error("❌ Erro ao inicializar banco", error=str(e))
        raise
    
    yield
    
    # Cleanup
    try:
        await close_db()
        logger.info("✅ Conexões do banco fechadas")
    except Exception as e:
        logger.error("❌ Erro ao fechar banco", error=str(e))


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
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de compressão
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Incluir routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return JSONResponse({
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": "2025-01-20T10:38:50Z"
    })


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
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
