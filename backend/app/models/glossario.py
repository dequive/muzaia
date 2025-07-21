
from sqlalchemy import Column, String, Text, Enum, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database.models import Base

class NivelTecnico(str, enum.Enum):
    BASICO = "basico"
    INTERMEDIARIO = "intermediario"
    AVANCADO = "avancado"

class StatusGlossario(str, enum.Enum):
    RASCUNHO = "rascunho"
    VALIDADO = "validado"
    REVOGADO = "revogado"

class CategoriaJuridica(str, enum.Enum):
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

class GlossarioTermo(Base):
    __tablename__ = "glossario_termos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    termo = Column(String(255), nullable=False, index=True)
    definicao = Column(Text, nullable=False)
    categoria = Column(Enum(CategoriaJuridica), nullable=False, index=True)
    nivel_tecnico = Column(Enum(NivelTecnico), nullable=False, default=NivelTecnico.BASICO)
    exemplo = Column(Text)
    sinonimos = Column(ARRAY(String), default=[])
    
    # Específico para legislação moçambicana
    jurisdicao = Column(String(100), default="mozambique", index=True)
    idioma = Column(String(5), default="pt")
    
    # Referências legais moçambicanas
    lei_referencia = Column(String(255))  # Ex: "Lei nº 19/97"
    artigo_referencia = Column(String(100))  # Ex: "Artigo 35"
    decreto_referencia = Column(String(255))  # Ex: "Decreto nº 43/2003"
    
    versao = Column(String(10), default="1.0")
    status = Column(Enum(StatusGlossario), default=StatusGlossario.RASCUNHO, index=True)
    revisado_por = Column(String(255))
    data_revisao = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    
    # Metadados adicionais
    metadados = Column(JSON, default={})
    tags = Column(ARRAY(String), default=[])

    def __repr__(self):
        return f"<GlossarioTermo(termo='{self.termo}', categoria='{self.categoria}', lei='{self.lei_referencia}')>"
