
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
        
        # Tópicos jurídicos válidos
        self.legal_keywords = [
            # Direito Civil
            "contrato", "contratos", "propriedade", "posse", "herança", "sucessão",
            "casamento", "divórcio", "união", "família", "guarda", "pensão",
            "danos", "responsabilidade civil", "obrigações", "direitos reais",
            
            # Direito Penal
            "crime", "crimes", "penal", "criminal", "prisão", "cadeia", "multa",
            "homicídio", "furto", "roubo", "violência", "agressão", "difamação",
            
            # Direito do Trabalho
            "trabalho", "emprego", "salário", "férias", "despedimento",
            "contrato trabalho", "direitos trabalhador", "sindicato",
            
            # Direito Administrativo
            "administração pública", "funcionário público", "licença",
            "autorização", "multa administrativa", "processo administrativo",
            
            # Direito Comercial
            "empresa", "sociedade", "negócio", "comercial", "falência",
            "concordata", "marca", "patente",
            
            # Direito Constitucional
            "constituição", "direitos fundamentais", "liberdade", "igualdade",
            "direitos humanos", "cidadania", "nacionalidade",
            
            # Direito Processual
            "processo", "tribunal", "juiz", "advogado", "recurso", "sentença",
            "execução", "citação", "audiência", "prova", "testemunha",
            
            # Direito Fiscal
            "imposto", "taxa", "contribuição", "iva", "irps", "fiscal",
            
            # Termos jurídicos gerais
            "lei", "leis", "código", "decreto", "regulamento", "artigo",
            "direito", "direitos", "dever", "deveres", "obrigação", "legal",
            "jurídico", "juridico", "legislação", "norma", "normas"
        ]
        
        # Tópicos não jurídicos que devem ser rejeitados
        self.non_legal_topics = [
            "receita", "culinária", "cozinha", "comida", "prato",
            "música", "filme", "cinema", "entretenimento", "jogo",
            "futebol", "desporto", "desportos", "esporte",
            "medicina", "saúde", "doença", "sintomas", "medicamento",
            "programação", "código", "software", "computador",
            "matemática", "cálculo", "física", "química",
            "geografia", "história", "biologia", "ciência",
            "clima", "tempo", "meteorologia", "previsão",
            "viagem", "turismo", "hotel", "restaurante",
            "moda", "roupa", "beleza", "cosmético",
            "tecnologia", "telefone", "internet", "app"
        ]
        
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
            # 0. Validar se a pergunta é sobre temas jurídicos
            if not self._is_legal_question(user_query):
                return self._generate_non_legal_response(user_query)
            
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
    
    def _is_legal_question(self, query: str) -> bool:
        """Verifica se a pergunta é sobre temas jurídicos."""
        query_lower = query.lower()
        
        # Verificar se contém tópicos não jurídicos (rejeitar imediatamente)
        if any(topic in query_lower for topic in self.non_legal_topics):
            return False
        
        # Verificar se contém pelo menos uma palavra-chave jurídica
        has_legal_keyword = any(keyword in query_lower for keyword in self.legal_keywords)
        
        # Padrões adicionais que indicam questões jurídicas
        legal_patterns = [
            "posso fazer", "tenho direito", "é legal", "é ilegal",
            "que diz a lei", "segundo a lei", "lei diz",
            "é crime", "é permitido", "é obrigatório",
            "meus direitos", "meus deveres", "posso processar",
            "como proceder", "que fazer", "devo fazer",
            "artigo", "código", "decreto", "regulamento"
        ]
        
        has_legal_pattern = any(pattern in query_lower for pattern in legal_patterns)
        
        return has_legal_keyword or has_legal_pattern

    def _is_sensitive_topic(self, query: str) -> bool:
        """Verifica se o tema é sensível."""
        query_lower = query.lower()
        return any(topic in query_lower for topic in self.sensitive_topics)
    
    def _generate_non_legal_response(self, query: str) -> Dict:
        """Resposta para perguntas não jurídicas."""
        return {
            "success": True,
            "response": "Desculpe, mas sou um assistente jurídico especializado e só posso responder "
                      "a questões relacionadas com direito e legislação moçambicana. "
                      "Para outros assuntos, por favor consulte fontes especializadas apropriadas. "
                      "\n\nPosso ajudá-lo com questões sobre direitos, deveres, legislação, "
                      "contratos, procedimentos legais e outras matérias jurídicas.",
            "sources": [],
            "confidence": 1.0,
            "requires_human": False,
            "escalation_reason": "non_legal_topic",
            "search_matches": 0,
            "response_type": "topic_restriction"
        }
    
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
