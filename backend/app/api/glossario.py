
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
"""
API endpoints para gestão do glossário jurídico.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/glossario", tags=["glossario"])

# Modelos Pydantic para o glossário
class TermoBase(BaseModel):
    termo: str
    definicao: str
    categoria: str
    nivel_tecnico: str
    exemplo: Optional[str] = None
    sinonimos: List[str] = []
    jurisdicao: str = "mozambique"
    idioma: str = "pt"
    lei_referencia: Optional[str] = None
    artigo_referencia: Optional[str] = None
    decreto_referencia: Optional[str] = None
    tags: List[str] = []

class TermoCreate(TermoBase):
    pass

class TermoUpdate(BaseModel):
    termo: Optional[str] = None
    definicao: Optional[str] = None
    categoria: Optional[str] = None
    nivel_tecnico: Optional[str] = None
    exemplo: Optional[str] = None
    sinonimos: Optional[List[str]] = None
    lei_referencia: Optional[str] = None
    artigo_referencia: Optional[str] = None
    decreto_referencia: Optional[str] = None
    tags: Optional[List[str]] = None

class TermoResponse(TermoBase):
    id: str
    versao: str = "1.0"
    status: str = "validado"
    revisado_por: Optional[str] = None
    data_revisao: str
    created_at: str
    updated_at: str
    is_active: bool = True
    metadados: Dict[str, Any] = {}

class TermosListResponse(BaseModel):
    items: List[TermoResponse]
    total: int
    pages: int
    current_page: int

class StatsResponse(BaseModel):
    total_termos: int
    por_categoria: Dict[str, int]
    por_nivel: Dict[str, int]
    por_status: Dict[str, int]
    por_jurisdicao: Dict[str, int]

# Dados mock para desenvolvimento
MOCK_TERMOS = [
    {
        "id": "1",
        "termo": "DUAT",
        "definicao": "Direito de Uso e Aproveitamento da Terra - direito real sobre a terra em Moçambique",
        "categoria": "direito_terra",
        "nivel_tecnico": "intermediario",
        "exemplo": "O DUAT é concedido pelo Estado para fins de habitação, agricultura ou investimento.",
        "sinonimos": ["Direito de Uso da Terra", "Título de Terra"],
        "jurisdicao": "mozambique",
        "idioma": "pt",
        "lei_referencia": "Lei nº 19/97",
        "artigo_referencia": "Artigo 35",
        "decreto_referencia": "Decreto nº 43/2003",
        "tags": ["terra", "propriedade", "agricultura"],
        "versao": "1.0",
        "status": "validado",
        "revisado_por": "Dr. João Silva",
        "data_revisao": "2024-01-15T10:30:00Z",
        "created_at": "2024-01-10T08:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "is_active": True,
        "metadados": {"fonte": "Lei de Terras", "complexidade": "media"}
    },
    {
        "id": "2",
        "termo": "Lobolo",
        "definicao": "Compensação matrimonial tradicional paga pela família do noivo à família da noiva",
        "categoria": "direito_familia",
        "nivel_tecnico": "basico",
        "exemplo": "O lobolo pode ser pago em dinheiro, gado ou outros bens conforme a tradição local.",
        "sinonimos": ["Compensação Matrimonial", "Dote"],
        "jurisdicao": "mozambique",
        "idioma": "pt",
        "lei_referencia": "Lei da Família",
        "artigo_referencia": "Artigo 15",
        "decreto_referencia": None,
        "tags": ["familia", "tradicional", "casamento"],
        "versao": "1.0",
        "status": "validado",
        "revisado_por": "Dra. Maria Santos",
        "data_revisao": "2024-01-20T14:15:00Z",
        "created_at": "2024-01-18T09:30:00Z",
        "updated_at": "2024-01-20T14:15:00Z",
        "is_active": True,
        "metadados": {"fonte": "Direito Costumeiro", "relevancia": "alta"}
    },
    {
        "id": "3",
        "termo": "Autoridade Tradicional",
        "definicao": "Entidade reconhecida pelo Estado que exerce funções de autoridade em comunidades locais",
        "categoria": "direito_administrativo",
        "nivel_tecnico": "intermediario",
        "exemplo": "As autoridades tradicionais participam na resolução de conflitos locais de terras.",
        "sinonimos": ["Régulo", "Chefe Tradicional", "Líder Comunitário"],
        "jurisdicao": "mozambique",
        "idioma": "pt",
        "lei_referencia": "Lei nº 2/2019",
        "artigo_referencia": "Artigo 3",
        "decreto_referencia": "Decreto nº 15/2000",
        "tags": ["tradicional", "autoridade", "comunidade"],
        "versao": "1.0",
        "status": "validado",
        "revisado_por": "Prof. Carlos Nunes",
        "data_revisao": "2024-01-25T16:45:00Z",
        "created_at": "2024-01-22T11:20:00Z",
        "updated_at": "2024-01-25T16:45:00Z",
        "is_active": True,
        "metadados": {"fonte": "Lei das Autoridades Tradicionais", "aplicabilidade": "nacional"}
    }
]

@router.get("/", response_model=TermosListResponse)
async def get_termos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    nivel_tecnico: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Lista termos do glossário com paginação e filtros."""
    try:
        logger.info("Listando termos do glossário", 
                   page=page, limit=limit, query=query, categoria=categoria)
        
        # Filtrar termos mock
        filtered_termos = MOCK_TERMOS.copy()
        
        if query:
            filtered_termos = [
                t for t in filtered_termos 
                if query.lower() in t["termo"].lower() or 
                   query.lower() in t["definicao"].lower()
            ]
        
        if categoria:
            filtered_termos = [t for t in filtered_termos if t["categoria"] == categoria]
        
        if nivel_tecnico:
            filtered_termos = [t for t in filtered_termos if t["nivel_tecnico"] == nivel_tecnico]
        
        if status:
            filtered_termos = [t for t in filtered_termos if t["status"] == status]
        
        # Paginação
        total = len(filtered_termos)
        start = (page - 1) * limit
        end = start + limit
        items = filtered_termos[start:end]
        
        return TermosListResponse(
            items=items,
            total=total,
            pages=(total + limit - 1) // limit,
            current_page=page
        )
    
    except Exception as e:
        logger.error("Erro ao listar termos", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/stats/overview", response_model=StatsResponse)
async def get_stats():
    """Obtém estatísticas do glossário."""
    try:
        logger.info("Obtendo estatísticas do glossário")
        
        # Calcular estatísticas dos dados mock
        total_termos = len(MOCK_TERMOS)
        
        por_categoria = {}
        por_nivel = {}
        por_status = {}
        por_jurisdicao = {}
        
        for termo in MOCK_TERMOS:
            # Por categoria
            cat = termo["categoria"]
            por_categoria[cat] = por_categoria.get(cat, 0) + 1
            
            # Por nível
            nivel = termo["nivel_tecnico"]
            por_nivel[nivel] = por_nivel.get(nivel, 0) + 1
            
            # Por status
            status = termo["status"]
            por_status[status] = por_status.get(status, 0) + 1
            
            # Por jurisdição
            jurisdicao = termo["jurisdicao"]
            por_jurisdicao[jurisdicao] = por_jurisdicao.get(jurisdicao, 0) + 1
        
        return StatsResponse(
            total_termos=total_termos,
            por_categoria=por_categoria,
            por_nivel=por_nivel,
            por_status=por_status,
            por_jurisdicao=por_jurisdicao
        )
    
    except Exception as e:
        logger.error("Erro ao obter estatísticas", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/{termo_id}", response_model=TermoResponse)
async def get_termo(termo_id: str):
    """Obtém um termo específico por ID."""
    try:
        logger.info("Obtendo termo por ID", termo_id=termo_id)
        
        termo = next((t for t in MOCK_TERMOS if t["id"] == termo_id), None)
        if not termo:
            raise HTTPException(status_code=404, detail="Termo não encontrado")
        
        return TermoResponse(**termo)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro ao obter termo", termo_id=termo_id, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.post("/", response_model=TermoResponse)
async def create_termo(termo_data: TermoCreate):
    """Cria um novo termo no glossário."""
    try:
        logger.info("Criando novo termo", termo=termo_data.termo)
        
        # Gerar ID simples
        new_id = str(len(MOCK_TERMOS) + 1)
        
        # Criar novo termo
        new_termo = {
            "id": new_id,
            **termo_data.model_dump(),
            "versao": "1.0",
            "status": "rascunho",
            "revisado_por": None,
            "data_revisao": "2024-01-26T10:00:00Z",
            "created_at": "2024-01-26T10:00:00Z",
            "updated_at": "2024-01-26T10:00:00Z",
            "is_active": True,
            "metadados": {}
        }
        
        # Adicionar aos dados mock (em produção seria salvo no banco)
        MOCK_TERMOS.append(new_termo)
        
        return TermoResponse(**new_termo)
    
    except Exception as e:
        logger.error("Erro ao criar termo", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.put("/{termo_id}", response_model=TermoResponse)
async def update_termo(termo_id: str, termo_data: TermoUpdate):
    """Atualiza um termo existente."""
    try:
        logger.info("Atualizando termo", termo_id=termo_id)
        
        # Encontrar termo
        termo_index = next((i for i, t in enumerate(MOCK_TERMOS) if t["id"] == termo_id), None)
        if termo_index is None:
            raise HTTPException(status_code=404, detail="Termo não encontrado")
        
        # Atualizar termo
        termo = MOCK_TERMOS[termo_index].copy()
        update_data = termo_data.model_dump(exclude_unset=True)
        termo.update(update_data)
        termo["updated_at"] = "2024-01-26T10:00:00Z"
        
        # Salvar alterações (em produção seria no banco)
        MOCK_TERMOS[termo_index] = termo
        
        return TermoResponse(**termo)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro ao atualizar termo", termo_id=termo_id, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.delete("/{termo_id}")
async def delete_termo(termo_id: str):
    """Remove um termo do glossário."""
    try:
        logger.info("Removendo termo", termo_id=termo_id)
        
        # Encontrar e remover termo
        termo_index = next((i for i, t in enumerate(MOCK_TERMOS) if t["id"] == termo_id), None)
        if termo_index is None:
            raise HTTPException(status_code=404, detail="Termo não encontrado")
        
        # Remover termo (em produção seria marcado como inativo)
        del MOCK_TERMOS[termo_index]
        
        return {"message": "Termo removido com sucesso"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro ao remover termo", termo_id=termo_id, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/search", response_model=List[TermoResponse])
async def search_termos(
    query: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50)
):
    """Busca termos por texto."""
    try:
        logger.info("Buscando termos", query=query, limit=limit)
        
        # Buscar nos dados mock
        results = []
        query_lower = query.lower()
        
        for termo in MOCK_TERMOS:
            if (query_lower in termo["termo"].lower() or 
                query_lower in termo["definicao"].lower() or
                any(query_lower in tag.lower() for tag in termo["tags"]) or
                any(query_lower in sin.lower() for sin in termo["sinonimos"])):
                results.append(TermoResponse(**termo))
                
                if len(results) >= limit:
                    break
        
        return results
    
    except Exception as e:
        logger.error("Erro na busca de termos", query=query, error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
