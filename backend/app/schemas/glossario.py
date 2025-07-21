
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class NivelTecnico(str, Enum):
    BASICO = "basico"
    INTERMEDIARIO = "intermediario"
    AVANCADO = "avancado"

class StatusGlossario(str, Enum):
    RASCUNHO = "rascunho"
    VALIDADO = "validado"
    REVOGADO = "revogado"

class CategoriaJuridica(str, Enum):
    DIREITO_CONSTITUCIONAL = "direito_constitucional"
    DIREITO_PENAL = "direito_penal"
    DIREITO_CIVIL = "direito_civil"
    DIREITO_COMERCIAL = "direito_comercial"
    DIREITO_ADMINISTRATIVO = "direito_administrativo"
    DIREITO_TRABALHO = "direito_trabalho"
    DIREITO_TRIBUTARIO = "direito_tributario"
    PROCESSO_CIVIL = "processo_civil"
    PROCESSO_PENAL = "processo_penal"

class GlossarioTermoBase(BaseModel):
    termo: str = Field(..., min_length=1, max_length=255)
    definicao: str = Field(..., min_length=10)
    categoria: CategoriaJuridica
    nivel_tecnico: NivelTecnico = NivelTecnico.BASICO
    exemplo: Optional[str] = None
    sinonimos: List[str] = Field(default_factory=list)
    jurisdicao: str = "mozambique"
    idioma: str = "pt"
    tags: List[str] = Field(default_factory=list)
    metadados: Dict[str, Any] = Field(default_factory=dict)

class GlossarioTermoCreate(GlossarioTermoBase):
    pass

class GlossarioTermoUpdate(BaseModel):
    termo: Optional[str] = Field(None, min_length=1, max_length=255)
    definicao: Optional[str] = Field(None, min_length=10)
    categoria: Optional[CategoriaJuridica] = None
    nivel_tecnico: Optional[NivelTecnico] = None
    exemplo: Optional[str] = None
    sinonimos: Optional[List[str]] = None
    jurisdicao: Optional[str] = None
    idioma: Optional[str] = None
    tags: Optional[List[str]] = None
    metadados: Optional[Dict[str, Any]] = None
    status: Optional[StatusGlossario] = None

class GlossarioTermoResponse(GlossarioTermoBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    versao: str
    status: StatusGlossario
    revisado_por: Optional[str] = None
    data_revisao: datetime
    created_at: datetime
    updated_at: datetime
    is_active: bool

class GlossarioSearchRequest(BaseModel):
    query: Optional[str] = None
    categoria: Optional[CategoriaJuridica] = None
    nivel_tecnico: Optional[NivelTecnico] = None
    status: Optional[StatusGlossario] = None
    jurisdicao: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)

class GlossarioSearchResponse(BaseModel):
    items: List[GlossarioTermoResponse]
    total: int
    page: int
    pages: int
    has_next: bool
    has_prev: bool

class GlossarioStats(BaseModel):
    total_termos: int
    por_categoria: Dict[str, int]
    por_nivel: Dict[str, int]
    por_status: Dict[str, int]
    por_jurisdicao: Dict[str, int]
