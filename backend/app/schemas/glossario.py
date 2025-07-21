
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
    # Direito Constitucional Moçambicano
    DIREITO_CONSTITUCIONAL = "direito_constitucional"
    
    # Códigos Principais
    CODIGO_CIVIL = "codigo_civil"
    CODIGO_PENAL = "codigo_penal"
    CODIGO_PROCESSO_CIVIL = "codigo_processo_civil"
    CODIGO_PROCESSO_PENAL = "codigo_processo_penal"
    CODIGO_COMERCIAL = "codigo_comercial"
    
    # Direitos Específicos
    DIREITO_FAMILIA = "direito_familia"
    DIREITO_TRABALHO = "direito_trabalho"
    DIREITO_ADMINISTRATIVO = "direito_administrativo"
    DIREITO_TRIBUTARIO = "direito_tributario"
    DIREITO_TERRA = "direito_terra"
    DIREITO_MINEIRO = "direito_mineiro"
    DIREITO_AMBIENTAL = "direito_ambiental"
    
    # Legislação Específica de Moçambique
    LEI_INVESTIMENTO = "lei_investimento"
    LEI_TRABALHO = "lei_trabalho"
    LEI_TERRAS = "lei_terras"
    LEI_MINAS = "lei_minas"
    LEI_FLORESTAL = "lei_florestal"
    
    # Direito Costumeiro e Tradicional
    DIREITO_COSTUMEIRO = "direito_costumeiro"

class GlossarioTermoBase(BaseModel):
    termo: str = Field(..., min_length=1, max_length=255)
    definicao: str = Field(..., min_length=10)
    categoria: CategoriaJuridica
    nivel_tecnico: NivelTecnico = NivelTecnico.BASICO
    exemplo: Optional[str] = None
    sinonimos: List[str] = Field(default_factory=list)
    jurisdicao: str = "mozambique"
    idioma: str = "pt"
    lei_referencia: Optional[str] = Field(None, description="Ex: Lei nº 19/97")
    artigo_referencia: Optional[str] = Field(None, description="Ex: Artigo 35")
    decreto_referencia: Optional[str] = Field(None, description="Ex: Decreto nº 43/2003")
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
    lei_referencia: Optional[str] = None
    artigo_referencia: Optional[str] = None
    decreto_referencia: Optional[str] = None
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
    lei_referencia: Optional[str] = None
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
    por_lei: Dict[str, int]
