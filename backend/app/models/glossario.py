
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
    DIREITO_CONSTITUCIONAL = "direito_constitucional"
    DIREITO_PENAL = "direito_penal"
    DIREITO_CIVIL = "direito_civil"
    DIREITO_COMERCIAL = "direito_comercial"
    DIREITO_ADMINISTRATIVO = "direito_administrativo"
    DIREITO_TRABALHO = "direito_trabalho"
    DIREITO_TRIBUTARIO = "direito_tributario"
    PROCESSO_CIVIL = "processo_civil"
    PROCESSO_PENAL = "processo_penal"

class GlossarioTermo(Base):
    __tablename__ = "glossario_termos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    termo = Column(String(255), nullable=False, index=True)
    definicao = Column(Text, nullable=False)
    categoria = Column(Enum(CategoriaJuridica), nullable=False, index=True)
    nivel_tecnico = Column(Enum(NivelTecnico), nullable=False, default=NivelTecnico.BASICO)
    exemplo = Column(Text)
    sinonimos = Column(ARRAY(String), default=[])
    jurisdicao = Column(String(100), default="mozambique", index=True)
    idioma = Column(String(5), default="pt")
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
        return f"<GlossarioTermo(termo='{self.termo}', categoria='{self.categoria}')>"
