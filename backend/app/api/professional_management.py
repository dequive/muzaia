
"""
API para gestão de profissionais jurídicos - apenas para administradores.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
import structlog
from datetime import datetime, timedelta
import hashlib
import os
import jwt
from pathlib import Path

from app.database.connection import get_db_session
from app.models.technician_management import (
    LegalProfessional, ProfessionalApprovalLog, ProfessionalSession,
    UserRole, ProfessionalStatus, LegalSpecialty, Jurisdiction
)
from app.utils.security import hash_password, verify_password, create_access_token

logger = structlog.get_logger(__name__)
security = HTTPBearer()

router = APIRouter(prefix="/admin/professionals", tags=["professional-management"])

# Diretório para documentos de licenças
LICENSE_DOCS_PATH = Path("storage/license_documents")
LICENSE_DOCS_PATH.mkdir(parents=True, exist_ok=True)


async def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> LegalProfessional:
    """Verifica se o token é válido e se o usuário é admin."""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        # Buscar usuário
        result = await db.execute(
            select(LegalProfessional).where(
                and_(
                    LegalProfessional.user_id == user_id,
                    LegalProfessional.role.in_([UserRole.ADMIN, UserRole.STAFF]),
                    LegalProfessional.status == ProfessionalStatus.APPROVED
                )
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=403, detail="Acesso negado")
        
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception as e:
        logger.error("Error verifying admin token", error=str(e))
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/register")
async def register_professional(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: UserRole = Form(...),
    jurisdiction: Jurisdiction = Form(...),
    specialties: str = Form(...),  # JSON string
    license_number: Optional[str] = Form(None),
    professional_bio: Optional[str] = Form(None),
    license_document: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db_session)
):
    """Registra um novo profissional jurídico (aguarda aprovação)."""
    try:
        # Verificar se email já existe
        existing = await db.execute(
            select(LegalProfessional).where(LegalProfessional.email == email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Processar especialidades
        import json
        try:
            specialties_list = json.loads(specialties)
        except:
            specialties_list = [specialties] if specialties else []
        
        # Salvar documento de licença
        license_doc_path = None
        if license_document:
            # Gerar nome único para o arquivo
            file_extension = license_document.filename.split('.')[-1]
            safe_filename = f"{email.replace('@', '_')}_{datetime.now().timestamp()}.{file_extension}"
            license_doc_path = LICENSE_DOCS_PATH / safe_filename
            
            # Salvar arquivo
            with open(license_doc_path, "wb") as buffer:
                content = await license_document.read()
                buffer.write(content)
            
            license_doc_path = str(license_doc_path)
        
        # Criar profissional
        professional = LegalProfessional(
            user_id=f"prof_{uuid.uuid4().hex[:10]}",
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=role,
            jurisdiction=jurisdiction,
            specialties=specialties_list,
            license_number=license_number,
            professional_bio=professional_bio,
            license_document_path=license_doc_path,
            status=ProfessionalStatus.PENDING
        )
        
        db.add(professional)
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Profissional registrado com sucesso. Aguarde aprovação.",
            "professional_id": str(professional.id)
        })
        
    except Exception as e:
        logger.error("Error registering professional", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/pending")
async def get_pending_professionals(
    admin: LegalProfessional = Depends(verify_admin_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Lista profissionais pendentes de aprovação."""
    try:
        result = await db.execute(
            select(LegalProfessional).where(
                LegalProfessional.status == ProfessionalStatus.PENDING
            ).order_by(LegalProfessional.created_at.desc())
        )
        professionals = result.scalars().all()
        
        return JSONResponse({
            "success": True,
            "data": [
                {
                    "id": str(prof.id),
                    "full_name": prof.full_name,
                    "email": prof.email,
                    "role": prof.role.value,
                    "jurisdiction": prof.jurisdiction.value,
                    "specialties": prof.specialties,
                    "license_number": prof.license_number,
                    "professional_bio": prof.professional_bio,
                    "has_license_document": bool(prof.license_document_path),
                    "created_at": prof.created_at.isoformat()
                }
                for prof in professionals
            ]
        })
        
    except Exception as e:
        logger.error("Error getting pending professionals", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.post("/{professional_id}/approve")
async def approve_professional(
    professional_id: str,
    admin_notes: Optional[str] = None,
    admin: LegalProfessional = Depends(verify_admin_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Aprova um profissional jurídico."""
    try:
        # Buscar profissional
        professional = await db.get(LegalProfessional, professional_id)
        if not professional:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")
        
        if professional.status != ProfessionalStatus.PENDING:
            raise HTTPException(status_code=400, detail="Profissional não está pendente")
        
        # Atualizar status
        previous_status = professional.status
        professional.status = ProfessionalStatus.APPROVED
        professional.approved_by = admin.id
        professional.approved_at = datetime.utcnow()
        
        # Criar log
        approval_log = ProfessionalApprovalLog(
            professional_id=professional.id,
            admin_id=admin.id,
            action="approved",
            previous_status=previous_status.value,
            new_status=ProfessionalStatus.APPROVED.value,
            admin_notes=admin_notes
        )
        
        db.add(approval_log)
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": f"Profissional {professional.full_name} aprovado com sucesso"
        })
        
    except Exception as e:
        logger.error("Error approving professional", professional_id=professional_id, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.post("/{professional_id}/reject")
async def reject_professional(
    professional_id: str,
    reason: str,
    admin_notes: Optional[str] = None,
    admin: LegalProfessional = Depends(verify_admin_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Rejeita um profissional jurídico."""
    try:
        professional = await db.get(LegalProfessional, professional_id)
        if not professional:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")
        
        # Atualizar status
        previous_status = professional.status
        professional.status = ProfessionalStatus.REJECTED
        professional.rejection_reason = reason
        
        # Criar log
        approval_log = ProfessionalApprovalLog(
            professional_id=professional.id,
            admin_id=admin.id,
            action="rejected",
            previous_status=previous_status.value,
            new_status=ProfessionalStatus.REJECTED.value,
            reason=reason,
            admin_notes=admin_notes
        )
        
        db.add(approval_log)
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Profissional rejeitado"
        })
        
    except Exception as e:
        logger.error("Error rejecting professional", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/all")
async def get_all_professionals(
    status: Optional[ProfessionalStatus] = None,
    role: Optional[UserRole] = None,
    admin: LegalProfessional = Depends(verify_admin_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Lista todos os profissionais com filtros."""
    try:
        query = select(LegalProfessional)
        
        conditions = []
        if status:
            conditions.append(LegalProfessional.status == status)
        if role:
            conditions.append(LegalProfessional.role == role)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(LegalProfessional.created_at.desc())
        
        result = await db.execute(query)
        professionals = result.scalars().all()
        
        return JSONResponse({
            "success": True,
            "data": [
                {
                    "id": str(prof.id),
                    "full_name": prof.full_name,
                    "email": prof.email,
                    "role": prof.role.value,
                    "status": prof.status.value,
                    "jurisdiction": prof.jurisdiction.value,
                    "specialties": prof.specialties,
                    "current_load": f"{prof.current_load}/{prof.max_concurrent_cases}",
                    "total_cases": prof.total_cases_handled,
                    "average_rating": prof.average_rating,
                    "last_activity": prof.last_activity_at.isoformat() if prof.last_activity_at else None,
                    "created_at": prof.created_at.isoformat()
                }
                for prof in professionals
            ]
        })
        
    except Exception as e:
        logger.error("Error getting all professionals", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.post("/{professional_id}/suspend")
async def suspend_professional(
    professional_id: str,
    reason: str,
    admin_notes: Optional[str] = None,
    admin: LegalProfessional = Depends(verify_admin_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Suspende um profissional."""
    try:
        professional = await db.get(LegalProfessional, professional_id)
        if not professional:
            raise HTTPException(status_code=404, detail="Profissional não encontrado")
        
        previous_status = professional.status
        professional.status = ProfessionalStatus.SUSPENDED
        professional.is_active = False
        
        # Criar log
        approval_log = ProfessionalApprovalLog(
            professional_id=professional.id,
            admin_id=admin.id,
            action="suspended",
            previous_status=previous_status.value,
            new_status=ProfessionalStatus.SUSPENDED.value,
            reason=reason,
            admin_notes=admin_notes
        )
        
        db.add(approval_log)
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Profissional suspenso"
        })
        
    except Exception as e:
        logger.error("Error suspending professional", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")
