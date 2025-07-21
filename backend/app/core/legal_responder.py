
"""
Gerador de respostas legais em linguagem simples e acessível.
"""
import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import structlog
import httpx
import json

from app.core.semantic_search import SemanticSearchEngine
from app.core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class LegalResponseGenerator:
    """Gerador de respostas legais simplificadas."""
    
    def __init__(self):
        self.search_engine = SemanticSearchEngine()
        self.min_confidence_threshold = 0.4
        self.sensitive_topics = [
            "penal", "criminal", "prisão", "cadeia", "assassinato", "homicídio",
            "família", "divórcio", "guarda", "pensão alimentar",
            "direitos humanos", "tortura", "discriminação", "violência doméstica"
        ]
    
    async def generate_response(
        self,
        user_query: str,
        db,
        context: Optional[Dict] = None
    ) -> Dict:
        """Gera resposta baseada no repositório legal."""
        try:
            # 1. Buscar conteúdo relevante
            matches = await self.search_engine.search_legal_content(
                query=user_query,
                db=db,
                limit=5,
                min_confidence=self.min_confidence_threshold
            )
            
            if not matches:
                return self._generate_no_legal_basis_response(user_query)
            
            # 2. Verificar se é tema sensível
            is_sensitive = self._is_sensitive_topic(user_query)
            max_confidence = max([m["confidence"] for m in matches])
            
            if is_sensitive or max_confidence < 0.6:
                return self._generate_escalation_response(user_query, matches, is_sensitive)
            
            # 3. Gerar resposta com base legal
            response = await self._generate_legal_response(user_query, matches)
            
            return response
            
        except Exception as e:
            logger.error(f"Erro ao gerar resposta legal: {e}")
            return self._generate_error_response()
    
    def _is_sensitive_topic(self, query: str) -> bool:
        """Verifica se o tema é sensível."""
        query_lower = query.lower()
        return any(topic in query_lower for topic in self.sensitive_topics)
    
    async def _generate_legal_response(self, query: str, matches: List[Dict]) -> Dict:
        """Gera resposta baseada nos matches encontrados."""
        try:
            # Construir contexto legal
            legal_context = self._build_legal_context(matches)
            
            # Prompt para linguagem simples
            prompt = f"""
Com base na legislação moçambicana fornecida, responda à pergunta de forma clara e simples.

PERGUNTA: {query}

BASE LEGAL:
{legal_context}

INSTRUÇÕES:
- Responda em português simples e claro
- Use linguagem acessível ao cidadão comum
- Cite sempre a fonte legal (lei e artigo)
- Se houver dúvidas, seja honesto sobre limitações
- Mantenha o tom respeitoso e profissional
- Máximo 200 palavras

RESPOSTA:"""

            # Para este MVP, vou usar uma resposta estruturada simples
            # Em produção, aqui seria chamado um LLM como Claude ou GPT
            simplified_response = self._create_simplified_response(query, matches)
            
            return {
                "success": True,
                "response": simplified_response["text"],
                "sources": simplified_response["sources"],
                "confidence": simplified_response["confidence"],
                "requires_human": False,
                "search_matches": len(matches),
                "response_type": "legal_guidance"
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar resposta legal: {e}")
            return self._generate_error_response()
    
    def _build_legal_context(self, matches: List[Dict]) -> str:
        """Constrói contexto legal a partir dos matches."""
        context_parts = []
        
        for i, match in enumerate(matches[:3]):  # Top 3 matches
            context_parts.append(
                f"{i+1}. {match['source']}\n"
                f"   Conteúdo: {match['content']}\n"
                f"   Confiança: {match['confidence']:.2f}\n"
            )
        
        return "\n".join(context_parts)
    
    def _create_simplified_response(self, query: str, matches: List[Dict]) -> Dict:
        """Cria resposta simplificada (versão MVP sem LLM externo)."""
        top_match = matches[0]
        
        # Lógica simplificada baseada em padrões da query
        response_templates = {
            "posso": "Com base na legislação moçambicana, {answer}. Isto está previsto {source}.",
            "tenho direito": "Sim, tem direito. A lei moçambicana garante {answer} conforme {source}.",
            "é obrigatório": "Segundo a legislação, {answer}. Consulte {source} para mais detalhes.",
            "default": "De acordo com a legislação moçambicana, {answer}. Para mais informações, consulte {source}."
        }
        
        # Escolher template
        template = "default"
        query_lower = query.lower()
        for pattern in response_templates:
            if pattern in query_lower and pattern != "default":
                template = pattern
                break
        
        # Construir resposta
        answer_snippet = top_match["content"][:150] + "..." if len(top_match["content"]) > 150 else top_match["content"]
        source_ref = top_match["full_reference"]
        
        response_text = response_templates[template].format(
            answer=answer_snippet,
            source=source_ref
        )
        
        return {
            "text": response_text,
            "sources": [
                {
                    "title": match["source"],
                    "reference": match["full_reference"],
                    "confidence": match["confidence"]
                }
                for match in matches[:2]
            ],
            "confidence": top_match["confidence"]
        }
    
    def _generate_escalation_response(self, query: str, matches: List[Dict], is_sensitive: bool) -> Dict:
        """Gera resposta de escalação para humano."""
        reason = "tema sensível" if is_sensitive else "base legal insuficiente"
        
        return {
            "success": True,
            "response": f"A sua pergunta envolve um {reason} que requer análise especializada. "
                      f"Encaminhei para um dos nossos juristas, que responderá em breve.",
            "sources": [],
            "confidence": 0.0,
            "requires_human": True,
            "escalation_reason": reason,
            "search_matches": len(matches),
            "response_type": "human_escalation"
        }
    
    def _generate_no_legal_basis_response(self, query: str) -> Dict:
        """Resposta quando não há base legal suficiente."""
        return {
            "success": True,
            "response": "Não encontrei base legal suficiente no nosso repositório para responder "
                      "com segurança à sua pergunta. Encaminhei para um jurista especializado.",
            "sources": [],
            "confidence": 0.0,
            "requires_human": True,
            "escalation_reason": "no_legal_basis",
            "search_matches": 0,
            "response_type": "no_legal_basis"
        }
    
    def _generate_error_response(self) -> Dict:
        """Resposta de erro."""
        return {
            "success": False,
            "response": "Ocorreu um erro ao processar a sua pergunta. Por favor, tente novamente.",
            "sources": [],
            "confidence": 0.0,
            "requires_human": True,
            "escalation_reason": "system_error",
            "search_matches": 0,
            "response_type": "error"
        }


# Instância global
response_generator = LegalResponseGenerator()
