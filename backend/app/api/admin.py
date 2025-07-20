
"""
API para administração de utilizadores profissionais.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
import structlog
from datetime import datetime
import uuid

from app.database.connection import get_db_session
from app.models.admin_user import (
    ProfessionalUser, AdminUser, ProfessionalApprovalLog,
    UserRole, UserStatus, LegalSpecialization
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


# Dependency para verificar se é admin
async def get_current_admin(
    db: AsyncSession = Depends(get_db_session),
    # Aqui seria adicionada a verificação JWT
) -> AdminUser:
    """Verifica se o utilizador atual é admin."""
    # Mock - em produção, extrair do JWT
    mock_admin_id = "admin_123"
    
    result = await db.execute(
        select(AdminUser).where(AdminUser.id == mock_admin_id)
    )
    admin = result.scalar_one_or_none()
    
    if not admin or not admin.is_active:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return admin


@router.get("/professionals")
async def list_professionals(
    status: Optional[str] = None,
    role: Optional[str] = None,
    specialization: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db_session),
    admin: AdminUser = Depends(get_current_admin)
):
    """Lista utilizadores profissionais com filtros."""
    try:
        query = select(ProfessionalUser)
        
        # Aplicar filtros
        filters = []
        if status:
            filters.append(ProfessionalUser.status == UserStatus(status))
        if role:
            filters.append(ProfessionalUser.role == UserRole(role))
        if specialization:
            filters.append(ProfessionalUser.specializations.contains([specialization]))
        
        if filters:
            query = query.where(and_(*filters))
        
        # Paginação
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        result = await db.execute(query)
        professionals = result.scalars().all()
        
        return JSONResponse({
            "success": True,
            "professionals": [
                {
                    "id": str(p.id),
                    "email": p.email,
                    "full_name": p.full_name,
                    "role": p.role.value,
                    "status": p.status.value,
                    "specializations": p.specializations,
                    "jurisdiction": p.jurisdiction,
                    "license_number": p.license_number,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "approved_at": p.approved_at.isoformat() if p.approved_at else None,
                    "last_active_at": p.last_active_at.isoformat() if p.last_active_at else None,
                    "total_conversations": p.total_conversations,
                    "user_rating": p.user_rating
                }
                for p in professionals
            ],
            "page": page,
            "limit": limit,
            "total": len(professionals)
        })
        
    except Exception as e:
        logger.error("Error listing professionals", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/professionals")
async def create_professional(
    email: str = Form(...),
    full_name: str = Form(...),
    role: str = Form(...),
    specializations: str = Form(...),  # JSON string
    jurisdiction: str = Form(...),
    license_number: str = Form(None),
    professional_email: str = Form(None),
    phone: str = Form(None),
    notes: str = Form(None),
    license_document: UploadFile = File(None),
    db: AsyncSession = Depends(get_db_session),
    admin: AdminUser = Depends(get_current_admin)
):
    """Cria novo utilizador profissional."""
    try:
        # Verificar se email já existe
        existing = await db.execute(
            select(ProfessionalUser).where(ProfessionalUser.email == email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email já existe")
        
        # Processar especializações
        import json
        try:
            specializations_list = json.loads(specializations)
        except:
            specializations_list = [specializations]
        
        # Criar utilizador
        professional = ProfessionalUser(
            email=email,
            full_name=full_name,
            role=UserRole(role),
            specializations=specializations_list,
            jurisdiction=jurisdiction,
            license_number=license_number,
            professional_email=professional_email or email,
            phone=phone,
            notes=notes,
            status=UserStatus.PENDING
        )
        
        # Definir senha temporária
        temp_password = f"temp_{uuid.uuid4().hex[:8]}"
        professional.set_password(temp_password)
        
        # Salvar documento se fornecido
        if license_document:
            # Aqui seria implementado o upload para storage
            document_path = f"documents/{professional.id}/{license_document.filename}"
            professional.license_document_path = document_path
        
        db.add(professional)
        await db.commit()
        
        # Log da criação
        log_entry = ProfessionalApprovalLog(
            professional_user_id=professional.id,
            admin_user_id=admin.id,
            action="created",
            reason="Criado pelo administrador",
            new_status=UserStatus.PENDING.value,
            notes=f"Senha temporária: {temp_password}"
        )
        db.add(log_entry)
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Utilizador profissional criado com sucesso",
            "professional_id": str(professional.id),
            "temp_password": temp_password
        })
        
    except Exception as e:
        logger.error("Error creating professional", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/professionals/{professional_id}/approve")
async def approve_professional(
    professional_id: str,
    reason: str = Form(None),
    notes: str = Form(None),
    db: AsyncSession = Depends(get_db_session),
    admin: AdminUser = Depends(get_current_admin)
):
    """Aprova utilizador profissional."""
    try:
        professional = await db.get(ProfessionalUser, professional_id)
        if not professional:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado")
        
        previous_status = professional.status
        professional.status = UserStatus.APPROVED
        professional.approved_by = admin.id
        professional.approved_at = datetime.utcnow()
        
        # Log da aprovação
        log_entry = ProfessionalApprovalLog(
            professional_user_id=professional.id,
            admin_user_id=admin.id,
            action="approved",
            reason=reason,
            previous_status=previous_status.value,
            new_status=UserStatus.APPROVED.value,
            notes=notes
        )
        db.add(log_entry)
        
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Utilizador aprovado com sucesso"
        })
        
    except Exception as e:
        logger.error("Error approving professional", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/professionals/{professional_id}/reject")
async def reject_professional(
    professional_id: str,
    reason: str = Form(...),
    notes: str = Form(None),
    db: AsyncSession = Depends(get_db_session),
    admin: AdminUser = Depends(get_current_admin)
):
    """Rejeita utilizador profissional."""
    try:
        professional = await db.get(ProfessionalUser, professional_id)
        if not professional:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado")
        
        previous_status = professional.status
        professional.status = UserStatus.BLOCKED
        
        # Log da rejeição
        log_entry = ProfessionalApprovalLog(
            professional_user_id=professional.id,
            admin_user_id=admin.id,
            action="rejected",
            reason=reason,
            previous_status=previous_status.value,
            new_status=UserStatus.BLOCKED.value,
            notes=notes
        )
        db.add(log_entry)
        
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Utilizador rejeitado"
        })
        
    except Exception as e:
        logger.error("Error rejecting professional", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/professionals/{professional_id}")
async def get_professional_details(
    professional_id: str,
    db: AsyncSession = Depends(get_db_session),
    admin: AdminUser = Depends(get_current_admin)
):
    """Obter detalhes completos de um profissional."""
    try:
        professional = await db.get(ProfessionalUser, professional_id)
        if not professional:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado")
        
        # Buscar logs de aprovação
        logs_result = await db.execute(
            select(ProfessionalApprovalLog)
            .where(ProfessionalApprovalLog.professional_user_id == professional.id)
            .order_by(ProfessionalApprovalLog.created_at.desc())
        )
        logs = logs_result.scalars().all()
        
        return JSONResponse({
            "success": True,
            "professional": {
                "id": str(professional.id),
                "email": professional.email,
                "full_name": professional.full_name,
                "role": professional.role.value,
                "status": professional.status.value,
                "specializations": professional.specializations,
                "jurisdiction": professional.jurisdiction,
                "license_number": professional.license_number,
                "professional_email": professional.professional_email,
                "phone": professional.phone,
                "notes": professional.notes,
                "verification_notes": professional.verification_notes,
                "created_at": professional.created_at.isoformat() if professional.created_at else None,
                "approved_at": professional.approved_at.isoformat() if professional.approved_at else None,
                "last_active_at": professional.last_active_at.isoformat() if professional.last_active_at else None,
                "total_conversations": professional.total_conversations,
                "average_response_time": professional.average_response_time,
                "user_rating": professional.user_rating,
                "uploaded_documents": professional.uploaded_documents
            },
            "approval_logs": [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "reason": log.reason,
                    "previous_status": log.previous_status,
                    "new_status": log.new_status,
                    "notes": log.notes,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ]
        })
        
    except Exception as e:
        logger.error("Error getting professional details", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db_session),
    admin: AdminUser = Depends(get_current_admin)
):
    """Estatísticas do painel administrativo."""
    try:
        # Contar por status
        pending_count = await db.execute(
            select(ProfessionalUser).where(ProfessionalUser.status == UserStatus.PENDING)
        )
        approved_count = await db.execute(
            select(ProfessionalUser).where(ProfessionalUser.status == UserStatus.APPROVED)
        )
        blocked_count = await db.execute(
            select(ProfessionalUser).where(ProfessionalUser.status == UserStatus.BLOCKED)
        )
        
        return JSONResponse({
            "success": True,
            "stats": {
                "pending_approvals": len(pending_count.scalars().all()),
                "approved_professionals": len(approved_count.scalars().all()),
                "blocked_professionals": len(blocked_count.scalars().all()),
                "total_professionals": len(pending_count.scalars().all()) + len(approved_count.scalars().all()) + len(blocked_count.scalars().all())
            }
        })
        
    except Exception as e:
        logger.error("Error getting admin stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
