
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import structlog
import asyncio

from app.models.human_handoff import HandoffManager, HandoffRequest, Specialization
from app.database.connection import get_db_session

logger = structlog.get_logger(__name__)


class ConversationMode(str, Enum):
    """Modo da conversa."""
    AI_ONLY = "ai_only"
    HUMAN_PENDING = "human_pending" 
    HUMAN_ACTIVE = "human_active"
    HYBRID = "hybrid"  # IA + Humano em paralelo


class ConversationOrchestrator:
    """
    Orquestrador central que decide quando encaminhar para técnico jurídico.
    """
    
    def __init__(self):
        self.active_conversations: Dict[str, Dict[str, Any]] = {}
        
    def should_escalate_to_human(
        self, 
        message: str, 
        conversation_history: List[Dict],
        ai_confidence: float = 0.0
    ) -> bool:
        """
        Decide se deve escalonar para técnico humano baseado em:
        - Pedido explícito do usuário
        - Baixa confiança da IA 
        - Palavras-chave jurídicas complexas
        - Múltiplas tentativas sem resolução
        """
        # Pedido explícito
        escalation_keywords = [
            "falar com advogado", "falar com técnico", "preciso de ajuda humana",
            "quero falar com uma pessoa", "não estou satisfeito", "isto não funciona"
        ]
        
        if any(keyword in message.lower() for keyword in escalation_keywords):
            logger.info("Escalation triggered by user request")
            return True
            
        # Confiança baixa da IA
        if ai_confidence < 0.6:
            logger.info("Escalation triggered by low AI confidence", confidence=ai_confidence)
            return True
            
        # Tópicos jurídicos complexos
        complex_legal_keywords = [
            "processo judicial", "tribunal", "recurso", "sentença",
            "divórcio", "herança", "contrato", "despedimento",
            "acidente", "negligência médica", "direitos humanos"
        ]
        
        if any(keyword in message.lower() for keyword in complex_legal_keywords):
            logger.info("Escalation triggered by complex legal topic")
            return True
            
        # Múltiplas interações sem resolução
        if len(conversation_history) > 6:
            recent_messages = conversation_history[-4:]
            if all("não entendi" in msg.get('content', '').lower() 
                   or "desculpe" in msg.get('content', '').lower() 
                   for msg in recent_messages 
                   if msg.get('role') == 'assistant'):
                logger.info("Escalation triggered by repeated AI failures")
                return True
                
        return False
    
    async def handle_message(
        self,
        conversation_id: str,
        user_id: str,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Processa mensagem e decide roteamento (IA vs Humano).
        """
        conversation = self.active_conversations.get(conversation_id, {
            'mode': ConversationMode.AI_ONLY,
            'history': [],
            'handoff_id': None,
            'technician_id': None
        })
        
        # Adicionar mensagem ao histórico
        conversation['history'].append({
            'role': 'user',
            'content': message,
            'timestamp': datetime.utcnow(),
            'user_id': user_id
        })
        
        # Verificar se deve escalonar
        ai_confidence = context.get('confidence', 0.8)
        should_escalate = self.should_escalate_to_human(
            message, 
            conversation['history'],
            ai_confidence
        )
        
        response = {
            'conversation_id': conversation_id,
            'should_escalate': should_escalate,
            'current_mode': conversation['mode'],
            'recommendation': None
        }
        
        if should_escalate and conversation['mode'] == ConversationMode.AI_ONLY:
            # Iniciar processo de handoff
            response['recommendation'] = 'initiate_handoff'
            response['escalation_reason'] = self._get_escalation_reason(message, ai_confidence)
            
        self.active_conversations[conversation_id] = conversation
        return response
    
    async def initiate_handoff(
        self,
        conversation_id: str,
        user_id: str,
        specialization: str = "general",
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Inicia processo de transferência para técnico."""
        
        async with get_db_session() as db:
            handoff_manager = HandoffManager(db)
            
            # Gerar resumo da conversa
            conversation = self.active_conversations.get(conversation_id, {})
            ai_summary = self._generate_conversation_summary(conversation.get('history', []))
            
            request = HandoffRequest(
                conversation_id=conversation_id,
                user_id=user_id,
                specialization=Specialization(specialization),
                reason=reason or "Solicitação automática do sistema"
            )
            
            handoff = await handoff_manager.request_handoff(request, ai_summary)
            
            # Atualizar estado da conversa
            if conversation_id in self.active_conversations:
                self.active_conversations[conversation_id].update({
                    'mode': ConversationMode.HUMAN_PENDING,
                    'handoff_id': str(handoff.id)
                })
            
            return {
                'success': True,
                'handoff_id': str(handoff.id),
                'status': handoff.status.value
            }
    
    def _get_escalation_reason(self, message: str, confidence: float) -> str:
        """Gera razão para escalação."""
        if confidence < 0.6:
            return f"Baixa confiança da IA ({confidence:.2f})"
        elif any(word in message.lower() for word in ["advogado", "técnico", "pessoa"]):
            return "Solicitação explícita do usuário"
        else:
            return "Tópico jurídico complexo detectado"
    
    def _generate_conversation_summary(self, history: List[Dict]) -> str:
        """Gera resumo da conversa para o técnico."""
        if not history:
            return "Conversa sem histórico disponível."
            
        user_messages = [msg for msg in history if msg.get('role') == 'user']
        
        if len(user_messages) == 0:
            return "Nenhuma mensagem do usuário encontrada."
        elif len(user_messages) == 1:
            return f"Usuário perguntou: {user_messages[0]['content'][:200]}..."
        else:
            first_msg = user_messages[0]['content'][:100]
            last_msg = user_messages[-1]['content'][:100]
            return f"Conversa iniciada com: {first_msg}... Última mensagem: {last_msg}... (Total: {len(history)} mensagens)"
