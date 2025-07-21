
"""
Sistema de busca semântica para o repositório jurídico.
"""
import asyncio
import json
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import httpx
from sentence_transformers import SentenceTransformer

from app.models.legal_repository import LegalDocument, LegalArticle, DocumentStatus
from app.core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class SemanticSearchEngine:
    """Motor de busca semântica para documentos legais."""
    
    def __init__(self):
        self.embedding_model = None
        self.vector_dimension = 384  # all-MiniLM-L6-v2
        
    async def initialize(self):
        """Inicializa o modelo de embedding."""
        try:
            # Usar modelo local leve para embeddings
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Modelo de embedding inicializado")
        except Exception as e:
            logger.error(f"Erro ao inicializar modelo: {e}")
            raise
    
    async def get_embedding(self, text: str) -> List[float]:
        """Gera embedding para um texto."""
        if not self.embedding_model:
            await self.initialize()
        
        try:
            # Normalizar texto
            clean_text = self._preprocess_text(text)
            embedding = self.embedding_model.encode([clean_text])[0]
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {e}")
            return []
    
    def _preprocess_text(self, text: str) -> str:
        """Pré-processa texto para busca semântica."""
        # Limpar e normalizar
        text = text.strip().lower()
        # Remover caracteres especiais desnecessários
        import re
        text = re.sub(r'[^\w\s\-\.]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text[:512]  # Limitar tamanho
    
    async def search_legal_content(
        self,
        query: str,
        db: AsyncSession,
        limit: int = 10,
        min_confidence: float = 0.3,
        jurisdictions: Optional[List[str]] = None,
        document_types: Optional[List[str]] = None
    ) -> List[Dict]:
        """Busca semântica no conteúdo legal."""
        try:
            # Gerar embedding da query
            query_embedding = await self.get_embedding(query)
            if not query_embedding:
                return []
            
            # Buscar documentos aprovados
            base_query = select(LegalDocument).where(
                LegalDocument.status == DocumentStatus.APPROVED
            )
            
            # Aplicar filtros
            if jurisdictions:
                base_query = base_query.where(LegalDocument.jurisdiction.in_(jurisdictions))
            if document_types:
                base_query = base_query.where(LegalDocument.document_type.in_(document_types))
            
            result = await db.execute(base_query)
            documents = result.scalars().all()
            
            # Buscar artigos dos documentos aprovados
            articles_query = select(LegalArticle).join(LegalDocument).where(
                LegalDocument.status == DocumentStatus.APPROVED
            )
            
            articles_result = await db.execute(articles_query)
            articles = articles_result.scalars().all()
            
            # Calcular similaridades
            matches = []
            
            # Processar documentos
            for doc in documents:
                doc_text = f"{doc.title} {doc.summary or ''}"
                doc_embedding = await self.get_embedding(doc_text)
                
                if doc_embedding:
                    similarity = self._cosine_similarity(query_embedding, doc_embedding)
                    if similarity >= min_confidence:
                        matches.append({
                            "type": "document",
                            "id": str(doc.id),
                            "title": doc.title,
                            "content": doc.summary or doc.title,
                            "source": f"{doc.document_type.value} - {doc.official_number or doc.title}",
                            "jurisdiction": doc.jurisdiction.value,
                            "confidence": float(similarity),
                            "legal_areas": doc.legal_areas or [],
                            "publication_date": doc.publication_date.isoformat() if doc.publication_date else None,
                            "full_reference": f"{doc.title} ({doc.official_number or 's/n'})"
                        })
            
            # Processar artigos
            for article in articles[:50]:  # Limitar para performance
                article_text = article.normalized_text or article.original_text
                if not article_text:
                    continue
                    
                article_embedding = await self.get_embedding(article_text)
                
                if article_embedding:
                    similarity = self._cosine_similarity(query_embedding, article_embedding)
                    if similarity >= min_confidence:
                        matches.append({
                            "type": "article",
                            "id": str(article.id),
                            "title": f"Artigo {article.article_number or 'N/A'}",
                            "content": article_text[:500] + ("..." if len(article_text) > 500 else ""),
                            "source": article.full_reference,
                            "confidence": float(similarity),
                            "legal_concepts": article.legal_concepts or [],
                            "full_reference": article.full_reference,
                            "document_id": str(article.document_id)
                        })
            
            # Ordenar por confiança
            matches.sort(key=lambda x: x["confidence"], reverse=True)
            
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Erro na busca semântica: {e}")
            return []
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calcula similaridade coseno entre dois vetores."""
        try:
            v1 = np.array(vec1)
            v2 = np.array(vec2)
            
            dot_product = np.dot(v1, v2)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception:
            return 0.0


# Instância global
search_engine = SemanticSearchEngine()
