"""
API para gestão do repositório jurídico.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
import structlog
from datetime import datetime
import uuid
import hashlib
import os
from pathlib import Path

from app.database.connection import get_db_session
from app.models.legal_repository import (
    LegalDocument, LegalArticle, DocumentValidationLog, LegalQuery,
    DocumentType, DocumentStatus, Jurisdiction, Language
)
from app.models.admin_user import AdminUser, ProfessionalUser, UserRole

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/legal", tags=["legal-repository"])

# Storage path para documentos
LEGAL_DOCS_STORAGE = Path("storage/legal_documents")
LEGAL_DOCS_STORAGE.mkdir(parents=True, exist_ok=True)


async def get_current_legal_user(
    db: AsyncSession = Depends(get_db_session),
    # Aqui seria adicionada a verificação JWT
) -> AdminUser | ProfessionalUser:
    """Verifica se o utilizador pode gerir documentos legais."""
    # Mock - em produção, extrair do JWT
    mock_user_id = "admin_123"
    
    # Verificar se é admin
    admin_result = await db.execute(
        select(AdminUser).where(AdminUser.id == mock_user_id)
    )
    admin = admin_result.scalar_one_or_none()
    if admin and admin.is_active:
        return admin
    
    # Verificar se é profissional aprovado
    prof_result = await db.execute(
        select(ProfessionalUser).where(
            and_(
                ProfessionalUser.id == mock_user_id,
                ProfessionalUser.status == "approved"
            )
        )
    )
    professional = prof_result.scalar_one_or_none()
    if professional and professional.can_login:
        return professional
    
    raise HTTPException(status_code=403, detail="Acesso negado")


@router.post("/documents")
async def upload_legal_document(
    title: str = Form(...),
    official_number: str = Form(None),
    document_type: str = Form(...),
    jurisdiction: str = Form(...),
    language: str = Form("pt"),
    publication_date: str = Form(None),
    effective_date: str = Form(None),
    legal_areas: str = Form("[]"),  # JSON string
    keywords: str = Form("[]"),
    summary: str = Form(None),
    upload_notes: str = Form(None),
    document_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
    user = Depends(get_current_legal_user)
):
    """Upload de novo documento legal."""
    try:
        # Validar arquivo
        if not document_file.filename.lower().endswith(('.pdf', '.docx', '.doc')):
            raise HTTPException(status_code=400, detail="Apenas arquivos PDF, DOC e DOCX são permitidos")
        
        # Ler e calcular hash do arquivo
        file_content = await document_file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        # Verificar se já existe documento com mesmo hash
        existing = await db.execute(
            select(LegalDocument).where(LegalDocument.file_hash == file_hash)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Documento já existe no repositório")
        
        # Salvar arquivo
        doc_id = str(uuid.uuid4())
        file_extension = document_file.filename.split('.')[-1]
        storage_filename = f"{doc_id}.{file_extension}"
        storage_path = LEGAL_DOCS_STORAGE / storage_filename
        
        with open(storage_path, "wb") as f:
            f.write(file_content)
        
        # Processar metadados
        import json
        try:
            legal_areas_list = json.loads(legal_areas)
            keywords_list = json.loads(keywords)
        except:
            legal_areas_list = [legal_areas] if legal_areas else []
            keywords_list = [keywords] if keywords else []
        
        # Criar registro do documento
        document = LegalDocument(
            id=doc_id,
            title=title,
            official_number=official_number,
            document_type=DocumentType(document_type),
            jurisdiction=Jurisdiction(jurisdiction),
            language=Language(language),
            publication_date=datetime.fromisoformat(publication_date) if publication_date else None,
            effective_date=datetime.fromisoformat(effective_date) if effective_date else None,
            storage_path=str(storage_path),
            file_hash=file_hash,
            file_size=str(len(file_content)),
            mime_type=document_file.content_type,
            legal_areas=legal_areas_list,
            keywords=keywords_list,
            summary=summary,
            uploaded_by=user.id,
            upload_notes=upload_notes,
            status=DocumentStatus.PENDING
        )
        
        db.add(document)
        await db.commit()
        
        # Log da criação
        log_entry = DocumentValidationLog(
            document_id=document.id,
            validator_id=user.id,
            action="uploaded",
            new_status=DocumentStatus.PENDING.value,
            notes=f"Documento carregado: {document_file.filename}"
        )
        db.add(log_entry)
        await db.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Documento carregado com sucesso",
            "document_id": str(document.id),
            "status": "pending_validation"
        })
        
    except Exception as e:
        logger.error("Error uploading legal document", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{document_id}/validate")
async def validate_legal_document(
    document_id: str,
    validation_notes: Optional[str] = None,
    user: AdminUser | ProfessionalUser = Depends(get_current_legal_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Valida um documento legal para uso da IA."""
    try:
        # Verificar se usuário pode validar (apenas advogados e admins)
        # if user.role not in [UserRole.LAWYER, UserRole.ADMIN]:
        #    raise HTTPException(status_code=403, detail="Apenas advogados podem validar documentos")

        # Buscar documento
        document = await db.get(LegalDocument, document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        if document.status != DocumentStatus.PENDING:
            raise HTTPException(status_code=400, detail="Documento não está pendente de validação")

        # Atualizar status
        previous_status = document.status
        document.status = DocumentStatus.APPROVED
        document.validated_by = user.id
        document.validated_at = datetime.utcnow()
        document.validation_notes = validation_notes

        # Criar log de validação
        validation_log = DocumentValidationLog(
            document_id=document.id,
            validator_id=user.id,
            action="approved",
            previous_status=previous_status.value,
            new_status=DocumentStatus.APPROVED.value,
            notes=validation_notes
        )

        db.add(validation_log)
        await db.commit()

        return JSONResponse({
            "success": True,
            "message": f"Documento '{document.title}' validado com sucesso",
            "document_id": document_id
        })

    except Exception as e:
        logger.error("Error validating legal document", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.post("/{document_id}/reject")
async def reject_legal_document(
    document_id: str,
    rejection_reason: str,
    user: AdminUser | ProfessionalUser = Depends(get_current_legal_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Rejeita um documento legal."""
    try:
        #if user.role not in [UserRole.LAWYER, UserRole.ADMIN]:
        #    raise HTTPException(status_code=403, detail="Apenas advogados podem rejeitar documentos")

        document = await db.get(LegalDocument, document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        previous_status = document.status
        document.status = DocumentStatus.REJECTED

        # Criar log
        validation_log = DocumentValidationLog(
            document_id=document.id,
            validator_id=user.id,
            action="rejected",
            previous_status=previous_status.value,
            new_status=DocumentStatus.REJECTED.value,
            reason=rejection_reason,
            notes=f"Rejeitado: {rejection_reason}"
        )

        db.add(validation_log)
        await db.commit()

        return JSONResponse({
            "success": True,
            "message": "Documento rejeitado",
            "document_id": document_id
        })

    except Exception as e:
        logger.error("Error rejecting legal document", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/{document_id}")
async def get_legal_document_details(
    document_id: str,
    user: AdminUser | ProfessionalUser = Depends(get_current_legal_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Obtém detalhes completos de um documento legal."""
    try:
        # Buscar documento
        document = await db.get(LegalDocument, document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        # Buscar artigos
        articles_result = await db.execute(
            select(LegalArticle).where(LegalArticle.document_id == document.id)
        )
        articles = articles_result.scalars().all()

        # Buscar logs de validação
        logs_result = await db.execute(
            select(DocumentValidationLog).where(
                DocumentValidationLog.document_id == document.id
            ).order_by(DocumentValidationLog.created_at.desc())
        )
        logs = logs_result.scalars().all()

        return JSONResponse({
            "success": True,
            "document": {
                "id": str(document.id),
                "title": document.title,
                "official_number": document.official_number,
                "document_type": document.document_type.value,
                "jurisdiction": document.jurisdiction.value,
                "language": document.language.value,
                "status": document.status.value,
                "publication_date": document.publication_date.isoformat() if document.publication_date else None,
                "effective_date": document.effective_date.isoformat() if document.effective_date else None,
                "legal_areas": document.legal_areas,
                "keywords": document.keywords,
                "summary": document.summary,
                "validation_notes": document.validation_notes,
                "validated_at": document.validated_at.isoformat() if document.validated_at else None,
                "created_at": document.created_at.isoformat() if document.created_at else None,
                "file_size": document.file_size,
                "mime_type": document.mime_type,
                "ai_query_count": document.ai_query_count,
                "human_reference_count": document.human_reference_count,
                "last_referenced_at": document.last_referenced_at.isoformat() if document.last_referenced_at else None,
                "is_active": document.is_active,
                "can_be_referenced": document.can_be_referenced
            },
            "articles": [
                {
                    "id": str(article.id),
                    "article_number": article.article_number,
                    "chapter": article.chapter,
                    "section": article.section,
                    "original_text": article.original_text,
                    "normalized_text": article.normalized_text,
                    "summary": article.summary,
                    "semantic_tags": article.semantic_tags,
                    "legal_concepts": article.legal_concepts,
                    "full_reference": article.full_reference,
                    "ai_query_count": article.ai_query_count
                }
                for article in articles
            ],
            "validation_logs": [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "previous_status": log.previous_status,
                    "new_status": log.new_status,
                    "issues_found": log.issues_found,
                    "recommendations": log.recommendations,
                    "notes": log.notes,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ]
        })

    except Exception as e:
        logger.error("Error getting legal document details", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_legal_content(
    query: str = Query(..., min_length=3),
    document_types: Optional[str] = None,
    jurisdictions: Optional[str] = None,
    only_active: bool = True,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db_session)
):
    """Busca conteúdo legal para a IA consultar."""
    try:
        # Base query para documentos ativos
        base_query = select(LegalDocument)

        filters = []
        if only_active:
            filters.append(LegalDocument.status == DocumentStatus.APPROVED)
            filters.append(LegalDocument.validated_by.isnot(None))

        # Filtros por tipo e jurisdição
        if document_types:
            types_list = document_types.split(',')
            filters.append(LegalDocument.document_type.in_(types_list))

        if jurisdictions:
            jurisdictions_list = jurisdictions.split(',')
            filters.append(LegalDocument.jurisdiction.in_(jurisdictions_list))

        # Busca textual
        search_filter = or_(
            LegalDocument.title.ilike(f"%{query}%"),
            LegalDocument.summary.ilike(f"%{query}%"),
            LegalDocument.keywords.astext.ilike(f"%{query}%")
        )
        filters.append(search_filter)

        if filters:
            base_query = base_query.where(and_(*filters))

        base_query = base_query.limit(limit)

        result = await db.execute(base_query)
        documents = result.scalars().all()

        # Buscar artigos relevantes
        articles_query = select(LegalArticle).join(LegalDocument).where(
            and_(
                LegalDocument.status == DocumentStatus.APPROVED,
                or_(
                    LegalArticle.original_text.ilike(f"%{query}%"),
                    LegalArticle.normalized_text.ilike(f"%{query}%"),
                    LegalArticle.summary.ilike(f"%{query}%")
                )
            )
        ).limit(limit * 2)

        articles_result = await db.execute(articles_query)
        articles = articles_result.scalars().all()

        return JSONResponse({
            "success": True,
            "query": query,
            "documents": [
                {
                    "id": str(doc.id),
                    "title": doc.title,
                    "official_number": doc.official_number,
                    "document_type": doc.document_type.value,
                    "jurisdiction": doc.jurisdiction.value,
                    "summary": doc.summary,
                    "legal_areas": doc.legal_areas,
                    "relevance_score": 0.8  # Implementar scoring semântico
                }
                for doc in documents
            ],
            "articles": [
                {
                    "id": str(article.id),
                    "document_id": str(article.document_id),
                    "full_reference": article.full_reference,
                    "text": article.normalized_text or article.original_text,
                    "summary": article.summary,
                    "legal_concepts": article.legal_concepts,
                    "relevance_score": 0.7
                }
                for article in articles
            ],
            "total_found": len(documents) + len(articles)
        })

    except Exception as e:
        logger.error("Error searching legal content", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_legal_repository_stats(
    db: AsyncSession = Depends(get_db_session),
    user = Depends(get_current_legal_user)
):
    """Estatísticas do repositório legal."""
    try:
        # Contar por status
        stats_query = select(
            LegalDocument.status,
            func.count(LegalDocument.id).label('count')
        ).group_by(LegalDocument.status)

        result = await db.execute(stats_query)
        status_counts = {row.status.value: row.count for row in result}

        # Contar por tipo
        type_query = select(
            LegalDocument.document_type,
            func.count(LegalDocument.id).label('count')
        ).where(LegalDocument.status == DocumentStatus.APPROVED).group_by(LegalDocument.document_type)

        type_result = await db.execute(type_query)
        type_counts = {row.document_type.value: row.count for row in type_result}

        # Contar por jurisdição
        jurisdiction_query = select(
            LegalDocument.jurisdiction,
            func.count(LegalDocument.id).label('count')
        ).where(LegalDocument.status == DocumentStatus.APPROVED).group_by(LegalDocument.jurisdiction)

        jurisdiction_result = await db.execute(jurisdiction_query)
        jurisdiction_counts = {row.jurisdiction.value: row.count for row in jurisdiction_result}

        return JSONResponse({
            "success": True,
            "stats": {
                "by_status": status_counts,
                "by_type": type_counts,
                "by_jurisdiction": jurisdiction_counts,
                "total_documents": sum(status_counts.values()),
                "active_documents": status_counts.get("approved", 0),
                "pending_validation": status_counts.get("pending", 0) + status_counts.get("under_review", 0)
            }
        })

    except Exception as e:
        logger.error("Error getting legal repository stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))