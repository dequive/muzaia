
"""
Sistema de autenticação para profissionais jurídicos.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
import structlog
from datetime import datetime, timedelta
import jwt
import uuid

from app.database.connection import get_db_session
from app.models.technician_management import (
    LegalProfessional, ProfessionalSession,
    UserRole, ProfessionalStatus
)
from app.utils.security import verify_password, create_access_token

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/auth/professional", tags=["professional-auth"])

JWT_SECRET = "your-secret-key"  # Em produção, usar variável de ambiente
JWT_ALGORITHM = "HS256"


@router.post("/login")
async def professional_login(
    email: str,
    password: str,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Login para profissionais jurídicos."""
    try:
        # Buscar profissional
        result = await db.execute(
            select(LegalProfessional).where(
                and_(
                    LegalProfessional.email == email,
                    LegalProfessional.status == ProfessionalStatus.APPROVED,
                    LegalProfessional.is_active == True
                )
            )
        )
        professional = result.scalar_one_or_none()
        
        if not professional or not verify_password(password, professional.password_hash):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Criar token
        token_data = {
            "sub": professional.user_id,
            "email": professional.email,
            "role": professional.role.value,
            "professional_id": str(professional.id),
            "exp": datetime.utcnow() + timedelta(hours=8)
        }
        access_token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Criar sessão
        session = ProfessionalSession(
            professional_id=professional.id,
            session_token=access_token,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            expires_at=datetime.utcnow() + timedelta(hours=8)
        )
        
        # Atualizar último login
        professional.last_login_at = datetime.utcnow()
        professional.last_activity_at = datetime.utcnow()
        
        db.add(session)
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 28800,  # 8 horas
            "professional": {
                "id": str(professional.id),
                "user_id": professional.user_id,
                "full_name": professional.full_name,
                "email": professional.email,
                "role": professional.role.value,
                "specialties": professional.specialties,
                "current_load": professional.current_load,
                "max_concurrent_cases": professional.max_concurrent_cases
            }
        })
        
    except Exception as e:
        logger.error("Error in professional login", email=email, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.post("/logout")
async def professional_logout(
    token: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Logout do profissional."""
    try:
        # Invalidar sessão
        result = await db.execute(
            select(ProfessionalSession).where(
                ProfessionalSession.session_token == token
            )
        )
        session = result.scalar_one_or_none()
        
        if session:
            session.is_active = False
            await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Logout realizado com sucesso"
        })
        
    except Exception as e:
        logger.error("Error in professional logout", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/me")
async def get_professional_profile(
    token: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Obter perfil do profissional logado."""
    try:
        # Verificar token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        # Buscar profissional
        result = await db.execute(
            select(LegalProfessional).where(
                LegalProfessional.user_id == user_id
            )
        )
        professional = result.scalar_one_or_none()
        
        if not professional:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")
        
        return JSONResponse({
            "success": True,
            "data": {
                "id": str(professional.id),
                "user_id": professional.user_id,
                "full_name": professional.full_name,
                "email": professional.email,
                "role": professional.role.value,
                "status": professional.status.value,
                "specialties": professional.specialties,
                "jurisdiction": professional.jurisdiction.value,
                "license_number": professional.license_number,
                "professional_bio": professional.professional_bio,
                "current_load": professional.current_load,
                "max_concurrent_cases": professional.max_concurrent_cases,
                "total_cases_handled": professional.total_cases_handled,
                "average_rating": professional.average_rating,
                "last_activity_at": professional.last_activity_at.isoformat() if professional.last_activity_at else None
            }
        })
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception as e:
        logger.error("Error getting professional profile", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")
