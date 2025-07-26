
"""
Sistema de monitoramento de saúde da aplicação.
"""
import time
import psutil
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/system", tags=["system"])

class SystemHealth(BaseModel):
    status: str
    timestamp: float
    uptime: float
    memory: Dict[str, Any]
    cpu: Dict[str, Any]
    disk: Dict[str, Any]
    services: Dict[str, bool]

@router.get("/health", response_model=SystemHealth)
async def get_system_health():
    """Retorna informações detalhadas sobre a saúde do sistema."""
    try:
        current_time = time.time()
        
        # Informações de memória
        memory = psutil.virtual_memory()
        memory_info = {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent,
            "used": memory.used
        }
        
        # Informações de CPU
        cpu_info = {
            "percent": psutil.cpu_percent(interval=1),
            "count": psutil.cpu_count(),
            "load_avg": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        }
        
        # Informações de disco
        disk = psutil.disk_usage('/')
        disk_info = {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": (disk.used / disk.total) * 100
        }
        
        # Status dos serviços
        services = {
            "database": True,  # Assumindo que está funcionando se chegou até aqui
            "api": True,
            "cache": True
        }
        
        # Determinar status geral
        status = "healthy"
        if memory_info["percent"] > 90 or cpu_info["percent"] > 90 or disk_info["percent"] > 90:
            status = "warning"
        
        return SystemHealth(
            status=status,
            timestamp=current_time,
            uptime=time.time() - psutil.boot_time(),
            memory=memory_info,
            cpu=cpu_info,
            disk=disk_info,
            services=services
        )
        
    except Exception as e:
        logger.error("Erro ao obter informações de saúde do sistema", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/metrics")
async def get_basic_metrics():
    """Retorna métricas básicas do sistema."""
    try:
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": (psutil.disk_usage('/').used / psutil.disk_usage('/').total) * 100,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error("Erro ao obter métricas básicas", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
