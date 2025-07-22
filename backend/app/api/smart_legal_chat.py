"""
API para chat inteligente com base no repositório jurídico.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import structlog
from datetime import datetime
import uuid
from pydantic import validator

from app.database.connection import get_db_session
from app.core.legal_responder import response_generator
from app.models.legal_repository import LegalQuery

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/chat", tags=["smart-legal-chat"])


class LegalChatRequest(BaseModel):
    """Request para chat legal."""
    pergunta: str = Field(..., min_length=5, max_length=1000, description="Pergunta jurídica do utilizador")
    conversa_id: Optional[str] = Field(None, description="ID da conversa (opcional)")
    contexto: Optional[Dict[str, Any]] = Field(None, description="Contexto adicional")
    jurisdicao_preferida: Optional[str] = Field("mozambique", description="Jurisdição preferida")

    @validator('pergunta')
    def validate_legal_question(cls, v):
        """Validação básica para garantir que é uma pergunta."""
        if not v.strip():
            raise ValueError("Pergunta não pode estar vazia")

        # Verificações básicas de spam/malícia
        spam_indicators = ["comprar", "vender", "desconto", "promoção", "grátis", "click aqui"]
        if any(spam in v.lower() for spam in spam_indicators):
            raise ValueError("Pergunta parece não ser relacionada com questões jurídicas")

        return v


class LegalChatResponse(BaseModel):
    """Response do chat legal."""
    sucesso: bool
    resposta: str
    fontes: list
    confianca: float
    requer_humano: bool
    motivo_escalacao: Optional[str] = None
    conversa_id: str
    timestamp: datetime


@router.post("/perguntar", response_model=Dict[str, Any])
async def perguntar_legal(
    request: LegalChatRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Endpoint principal para perguntas legais com IA."""
    try:
        # Gerar ID da conversa se não fornecido
        conversation_id = request.conversa_id or str(uuid.uuid4())

        logger.info(
            "Nova pergunta recebida",
            question=request.pergunta[:100],
            conversation_id=conversation_id
        )

        # Processar pergunta com o gerador de respostas
        start_time = datetime.utcnow()

        result = await response_generator.generate_response(
            user_query=request.pergunta,
            db=db,
            context=request.contexto
        )

        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        # Salvar log da query
        query_log = LegalQuery(
            conversation_id=conversation_id,
            user_query=request.pergunta,
            matched_documents=[],  # Implementar depois
            matched_articles=[],   # Implementar depois
            confidence_scores={},
            ai_response=result.get("response", ""),
            escalated_to_human=result.get("requires_human", False),
            escalation_reason=result.get("escalation_reason"),
            processing_time_ms=str(int(processing_time)),
            search_method="semantic",
            meta_data={
                "search_matches": result.get("search_matches", 0),
                "response_type": result.get("response_type", "unknown"),
                "jurisdiction": request.jurisdicao_preferida
            }
        )

        db.add(query_log)
        await db.commit()

        # Preparar resposta
        response_data = {
            "sucesso": result.get("success", True),
            "resposta": result.get("response", ""),
            "fontes": result.get("sources", []),
            "confianca": result.get("confidence", 0.0),
            "requer_humano": result.get("requires_human", False),
            "motivo_escalacao": result.get("escalation_reason"),
            "conversa_id": conversation_id,
            "timestamp": datetime.utcnow(),
            "tempo_processamento_ms": int(processing_time),
            "estatisticas": {
                "matches_encontrados": result.get("search_matches", 0),
                "tipo_resposta": result.get("response_type", "unknown")
            }
        }

        # Se requer humano, criar ticket (implementar depois)
        if result.get("requires_human"):
            logger.info(
                "Pergunta escalada para humano",
                conversation_id=conversation_id,
                reason=result.get("escalation_reason")
            )

        return JSONResponse(response_data)

    except Exception as e:
        logger.error("Erro ao processar pergunta legal", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao processar pergunta"
        )


@router.get("/conversa/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Obtém histórico de uma conversa."""
    try:
        from sqlalchemy import select

        result = await db.execute(
            select(LegalQuery)
            .where(LegalQuery.conversation_id == conversation_id)
            .order_by(LegalQuery.created_at)
        )

        queries = result.scalars().all()

        return JSONResponse({
            "conversa_id": conversation_id,
            "total_perguntas": len(queries),
            "perguntas": [
                {
                    "pergunta": q.user_query,
                    "resposta": q.ai_response,
                    "escalado_humano": q.escalated_to_human,
                    "motivo_escalacao": q.escalation_reason,
                    "timestamp": q.created_at.isoformat() if q.created_at else None,
                    "tempo_processamento": q.processing_time_ms
                }
                for q in queries
            ]
        })

    except Exception as e:
        logger.error("Erro ao buscar histórico", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.get("/estatisticas")
async def get_chat_statistics(
    db: AsyncSession = Depends(get_db_session)
):
    """Estatísticas do chat legal."""
    try:
        from sqlalchemy import select, func, and_
        from datetime import datetime, timedelta

        # Estatísticas dos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        # Total de consultas
        total_result = await db.execute(
            select(func.count(LegalQuery.id))
            .where(LegalQuery.created_at >= thirty_days_ago)
        )
        total_queries = total_result.scalar()

        # Escalações para humanos
        escalated_result = await db.execute(
            select(func.count(LegalQuery.id))
            .where(
                and_(
                    LegalQuery.created_at >= thirty_days_ago,
                    LegalQuery.escalated_to_human == True
                )
            )
        )
        escalated_count = escalated_result.scalar()

        # Taxa de sucesso da IA
        ai_success_rate = ((total_queries - escalated_count) / total_queries * 100) if total_queries > 0 else 0

        return JSONResponse({
            "periodo": "últimos 30 dias",
            "total_consultas": total_queries,
            "respondidas_pela_ia": total_queries - escalated_count,
            "escaladas_para_humanos": escalated_count,
            "taxa_sucesso_ia": round(ai_success_rate, 2),
            "tipos_escalacao": {
                "tema_sensivel": 0,  # Implementar contagem
                "base_legal_insuficiente": 0,  # Implementar contagem
                "erro_sistema": 0   # Implementar contagem
            }
        })

    except Exception as e:
        logger.error("Erro ao gerar estatísticas", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")


@router.post("/feedback")
async def submit_feedback(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db_session)
):
    """Recebe feedback sobre uma resposta."""
    try:
        conversation_id = request.get("conversa_id")
        rating = request.get("avaliacao", 0)  # 1-5
        comment = request.get("comentario", "")

        if not conversation_id:
            raise HTTPException(status_code=400, detail="ID da conversa obrigatório")

        # Atualizar query com feedback (implementar campo feedback na model)
        logger.info(
            "Feedback recebido",
            conversation_id=conversation_id,
            rating=rating
        )

        return JSONResponse({
            "sucesso": True,
            "mensagem": "Feedback registado com sucesso"
        })

    except Exception as e:
        logger.error("Erro ao processar feedback", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno")