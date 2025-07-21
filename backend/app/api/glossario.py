
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
import uuid
from datetime import datetime

from app.database.connection import get_db
from app.models.glossario import GlossarioTermo, CategoriaJuridica, NivelTecnico, StatusGlossario
from app.schemas.glossario import (
    GlossarioTermoCreate,
    GlossarioTermoUpdate,
    GlossarioTermoResponse,
    GlossarioSearchRequest,
    GlossarioSearchResponse,
    GlossarioStats
)

router = APIRouter(prefix="/glossario", tags=["Glossário Jurídico"])

@router.post("/", response_model=GlossarioTermoResponse)
async def criar_termo(
    termo_data: GlossarioTermoCreate,
    db: Session = Depends(get_db)
):
    """Criar novo termo no glossário"""
    
    # Verificar se o termo já existe
    existing = db.query(GlossarioTermo).filter(
        and_(
            GlossarioTermo.termo.ilike(f"%{termo_data.termo}%"),
            GlossarioTermo.is_active == True
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Termo '{termo_data.termo}' já existe no glossário"
        )
    
    # Criar novo termo
    db_termo = GlossarioTermo(
        **termo_data.model_dump(),
        id=uuid.uuid4(),
        versao="1.0",
        status=StatusGlossario.RASCUNHO
    )
    
    db.add(db_termo)
    db.commit()
    db.refresh(db_termo)
    
    return db_termo

@router.get("/", response_model=GlossarioSearchResponse)
async def listar_termos(
    query: Optional[str] = Query(None, description="Busca por termo ou definição"),
    categoria: Optional[CategoriaJuridica] = None,
    nivel_tecnico: Optional[NivelTecnico] = None,
    status: Optional[StatusGlossario] = None,
    jurisdicao: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Listar e pesquisar termos do glossário"""
    
    # Construir query base
    base_query = db.query(GlossarioTermo).filter(GlossarioTermo.is_active == True)
    
    # Aplicar filtros
    if query:
        search_filter = or_(
            GlossarioTermo.termo.ilike(f"%{query}%"),
            GlossarioTermo.definicao.ilike(f"%{query}%"),
            GlossarioTermo.sinonimos.any(query),
            GlossarioTermo.tags.any(query)
        )
        base_query = base_query.filter(search_filter)
    
    if categoria:
        base_query = base_query.filter(GlossarioTermo.categoria == categoria)
    
    if nivel_tecnico:
        base_query = base_query.filter(GlossarioTermo.nivel_tecnico == nivel_tecnico)
    
    if status:
        base_query = base_query.filter(GlossarioTermo.status == status)
    
    if jurisdicao:
        base_query = base_query.filter(GlossarioTermo.jurisdicao == jurisdicao)
    
    # Ordenar por termo
    base_query = base_query.order_by(GlossarioTermo.termo)
    
    # Contar total
    total = base_query.count()
    
    # Aplicar paginação
    offset = (page - 1) * limit
    items = base_query.offset(offset).limit(limit).all()
    
    # Calcular páginas
    pages = (total + limit - 1) // limit
    
    return GlossarioSearchResponse(
        items=items,
        total=total,
        page=page,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1
    )

@router.get("/{termo_id}", response_model=GlossarioTermoResponse)
async def obter_termo(termo_id: str, db: Session = Depends(get_db)):
    """Obter termo específico do glossário"""
    
    try:
        termo_uuid = uuid.UUID(termo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    termo = db.query(GlossarioTermo).filter(
        and_(
            GlossarioTermo.id == termo_uuid,
            GlossarioTermo.is_active == True
        )
    ).first()
    
    if not termo:
        raise HTTPException(status_code=404, detail="Termo não encontrado")
    
    return termo

@router.put("/{termo_id}", response_model=GlossarioTermoResponse)
async def atualizar_termo(
    termo_id: str,
    termo_data: GlossarioTermoUpdate,
    revisor: str = Query(..., description="ID do revisor"),
    db: Session = Depends(get_db)
):
    """Atualizar termo do glossário"""
    
    try:
        termo_uuid = uuid.UUID(termo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    termo = db.query(GlossarioTermo).filter(
        and_(
            GlossarioTermo.id == termo_uuid,
            GlossarioTermo.is_active == True
        )
    ).first()
    
    if not termo:
        raise HTTPException(status_code=404, detail="Termo não encontrado")
    
    # Atualizar campos
    update_data = termo_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(termo, field, value)
    
    # Atualizar metadados de revisão
    termo.revisado_por = revisor
    termo.data_revisao = datetime.now()
    
    # Incrementar versão se houver mudanças significativas
    if any(field in update_data for field in ['termo', 'definicao', 'categoria']):
        current_version = float(termo.versao)
        termo.versao = str(current_version + 0.1)
    
    db.commit()
    db.refresh(termo)
    
    return termo

@router.delete("/{termo_id}")
async def excluir_termo(termo_id: str, db: Session = Depends(get_db)):
    """Excluir (desativar) termo do glossário"""
    
    try:
        termo_uuid = uuid.UUID(termo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    termo = db.query(GlossarioTermo).filter(
        and_(
            GlossarioTermo.id == termo_uuid,
            GlossarioTermo.is_active == True
        )
    ).first()
    
    if not termo:
        raise HTTPException(status_code=404, detail="Termo não encontrado")
    
    termo.is_active = False
    termo.status = StatusGlossario.REVOGADO
    
    db.commit()
    
    return {"message": "Termo excluído com sucesso"}

@router.get("/stats/overview", response_model=GlossarioStats)
async def estatisticas_glossario(db: Session = Depends(get_db)):
    """Obter estatísticas do glossário"""
    
    # Total de termos ativos
    total_termos = db.query(GlossarioTermo).filter(GlossarioTermo.is_active == True).count()
    
    # Por categoria
    por_categoria = {}
    for categoria in CategoriaJuridica:
        count = db.query(GlossarioTermo).filter(
            and_(
                GlossarioTermo.categoria == categoria,
                GlossarioTermo.is_active == True
            )
        ).count()
        por_categoria[categoria.value] = count
    
    # Por nível técnico
    por_nivel = {}
    for nivel in NivelTecnico:
        count = db.query(GlossarioTermo).filter(
            and_(
                GlossarioTermo.nivel_tecnico == nivel,
                GlossarioTermo.is_active == True
            )
        ).count()
        por_nivel[nivel.value] = count
    
    # Por status
    por_status = {}
    for status in StatusGlossario:
        count = db.query(GlossarioTermo).filter(
            and_(
                GlossarioTermo.status == status,
                GlossarioTermo.is_active == True
            )
        ).count()
        por_status[status.value] = count
    
    # Por jurisdição
    jurisdicoes = db.query(GlossarioTermo.jurisdicao, func.count(GlossarioTermo.id)).filter(
        GlossarioTermo.is_active == True
    ).group_by(GlossarioTermo.jurisdicao).all()
    
    por_jurisdicao = {jurisdicao: count for jurisdicao, count in jurisdicoes}
    
    return GlossarioStats(
        total_termos=total_termos,
        por_categoria=por_categoria,
        por_nivel=por_nivel,
        por_status=por_status,
        por_jurisdicao=por_jurisdicao
    )

@router.post("/busca-semantica")
async def busca_semantica(
    query: str = Query(..., description="Termo a pesquisar"),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Busca semântica no glossário (implementação básica)"""
    
    # Implementação básica - pode ser melhorada com embeddings
    termos = db.query(GlossarioTermo).filter(
        and_(
            or_(
                GlossarioTermo.termo.ilike(f"%{query}%"),
                GlossarioTermo.definicao.ilike(f"%{query}%"),
                GlossarioTermo.sinonimos.any(query.lower()),
                GlossarioTermo.tags.any(query.lower())
            ),
            GlossarioTermo.is_active == True,
            GlossarioTermo.status == StatusGlossario.VALIDADO
        )
    ).limit(limit).all()
    
    return {
        "query": query,
        "resultados": [
            {
                "termo": termo.termo,
                "definicao": termo.definicao[:200] + "..." if len(termo.definicao) > 200 else termo.definicao,
                "categoria": termo.categoria.value,
                "nivel": termo.nivel_tecnico.value
            }
            for termo in termos
        ]
    }
