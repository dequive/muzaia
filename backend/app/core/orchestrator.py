# -*- coding: utf-8 -*-
"""
Orquestrador Principal de LLMs.

Coordena múltiplos modelos LLM para gerar respostas consensuais
com alta qualidade e confiabilidade.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import (
    LLMError, ConsensusError, LLMServiceError, InvalidInputError
)
from app.core.consensus_engine import ConsensusEngine
from app.core.protocols import AbstractLLMPool
from app.schemas import (
    GenerationParams, OrchestratorResponse, ModelResponse,
    ContextType, LLMResponse
)

logger = logging.getLogger(__name__)


class LLMOrchestrator:
    """
    Orquestrador principal para coordenação de múltiplos LLMs.
    
    Características:
    - Roteamento inteligente por contexto
    - Execução paralela de modelos
    - Sistema de consenso avançado
    - Fallback automático
    - Cache de respostas
    - Métricas detalhadas
    """

    def __init__(self, pool: AbstractLLMPool):
        """
        Inicializa o orquestrador.
        
        Args:
            pool: Pool de LLMs para gerenciamento de instâncias
        """
        self._pool = pool
        self._consensus_engine = ConsensusEngine()
        self._context_router = self._build_context_router()
        self._model_weights = self._build_model_weights()
        self._response_cache: Dict[str, OrchestratorResponse] = {}
        self._metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_response_time": 0.0,
            "consensus_scores": []
        }

    async def initialize(self) -> None:
        """Inicializa o orquestrador e valida componentes."""
        logger.info("Inicializando LLM Orchestrator...")
        
        try:
            # Validar modelos disponíveis
            await self._validate_available_models()
            
            # Inicializar consensus engine
            logger.info("Consensus Engine inicializado")
            
            # Validar configurações
            self._validate_configuration()
            
            logger.info("LLM Orchestrator inicializado com sucesso")
            
        except Exception as e:
            logger.error(f"Erro na inicialização do orquestrador: {e}")
            raise LLMServiceError(f"Falha na inicialização: {str(e)}")

    async def generate(
        self,
        query: str,
        context: str = ContextType.GENERAL.value,
        user_id: Optional[str] = None,
        params: Optional[GenerationParams] = None,
        min_confidence: float = None
    ) -> OrchestratorResponse:
        """
        Gera resposta orquestrada usando múltiplos LLMs.
        
        Args:
            query: Consulta do usuário
            context: Contexto da consulta
            user_id: Identificador do usuário
            params: Parâmetros de geração
            min_confidence: Confiança mínima exigida
            
        Returns:
            Resposta orquestrada com consenso
            
        Raises:
            InvalidInputError: Se entrada for inválida
            LLMServiceError: Se serviço estiver indisponível
            ConsensusError: Se não conseguir consenso adequado
        """
        start_time = time.time()
        self._metrics["total_requests"] += 1
        
        try:
            # Validar entrada
            await self._validate_input(query, context)
            
            # Verificar cache
            cache_key = self._generate_cache_key(query, context, params)
            if cache_key in self._response_cache:
                logger.info("Resposta encontrada no cache")
                return self._response_cache[cache_key]
            
            # Selecionar modelos para o contexto
            selected_models = self._select_models_for_context(context)
            
            if not selected_models:
                raise LLMServiceError("Nenhum modelo disponível para o contexto")
            
            logger.info(f"Modelos selecionados: {selected_models}")
            
            # Gerar respostas em paralelo
            responses = await self._generate_parallel_responses(
                query, context, selected_models, params
            )
            
            # Calcular consenso
            consensus_score, best_response = await self._consensus_engine.calculate_consensus(
                responses, self._model_weights
            )
            
            # Verificar confiança mínima
            min_conf = min_confidence or settings.orchestrator.default_min_confidence
            requires_review = consensus_score < min_conf
            
            # Mesclar respostas
            final_text = await self._consensus_engine.merge_responses(
                responses, consensus_score, best_response
            )
            
            # Detectar outliers
            outliers = await self._consensus_engine.detect_outliers(responses)
            if outliers:
                logger.warning(f"Outliers detectados: {outliers}")
            
            # Construir resposta final
            processing_time = time.time() - start_time
            orchestrator_response = OrchestratorResponse(
                response=final_text,
                confidence=consensus_score,
                model_responses=self._build_model_responses(responses),
                consensus_score=consensus_score,
                processing_time=processing_time,
                total_tokens=sum(r.tokens_used or 0 for r in responses),
                total_cost=sum(r.cost or 0.0 for r in responses),
                requires_review=requires_review,
                context_used=context,
                metadata={
                    "user_id": user_id,
                    "selected_models": selected_models,
                    "outliers": outliers,
                    "min_confidence_required": min_conf,
                    "timestamp": time.time()
                }
            )
            
            # Atualizar métricas
            self._update_metrics(True, processing_time, consensus_score)
            
            # Cache resposta se consenso alto
            if consensus_score >= 0.8:
                self._response_cache[cache_key] = orchestrator_response
            
            logger.info(
                f"Resposta gerada com sucesso | "
                f"consenso: {consensus_score:.3f} | "
                f"tempo: {processing_time:.2f}s | "
                f"modelos: {len(responses)}"
            )
            
            return orchestrator_response
            
        except (InvalidInputError, ConsensusError, LLMServiceError):
            self._update_metrics(False, time.time() - start_time, 0.0)
            raise
        except Exception as e:
            self._update_metrics(False, time.time() - start_time, 0.0)
            logger.error(f"Erro inesperado na geração: {e}", exc_info=True)
            raise LLMServiceError(f"Erro interno: {str(e)}")

    async def stream_generate(
        self,
        query: str,
        context: str = ContextType.GENERAL.value,
        user_id: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ):
        """
        Gera resposta em streaming usando o melhor modelo disponível.
        
        Args:
            query: Consulta do usuário
            context: Contexto da consulta
            user_id: Identificador do usuário
            params: Parâmetros de geração
            
        Yields:
            Chunks da resposta em streaming
        """
        try:
            # Validar entrada
            await self._validate_input(query, context)
            
            # Selecionar melhor modelo para streaming
            selected_models = self._select_models_for_context(context)
            if not selected_models:
                raise LLMServiceError("Nenhum modelo disponível")
            
            # Usar o primeiro modelo (mais confiável) para streaming
            primary_model = selected_models[0]
            
            async with self._pool.acquire(primary_model) as llm:
                async for chunk in llm.stream_generate(
                    query, context, self._build_system_prompt(context), params
                ):
                    yield {
                        "content": chunk.get("content", ""),
                        "is_final": chunk.get("is_final", False),
                        "model": primary_model,
                        "metadata": chunk.get("metadata", {})
                    }
                    
        except Exception as e:
            logger.error(f"Erro no streaming: {e}")
            yield {
                "content": f"Erro: {str(e)}",
                "is_final": True,
                "error": True
            }

    async def get_available_models(self) -> List[str]:
        """
        Obtém lista de modelos disponíveis.
        
        Returns:
            Lista de nomes dos modelos disponíveis
        """
        all_models = list(self._context_router.values())
        # Flatten list
        available = []
        for model_list in all_models:
            available.extend(model_list)
        
        return list(set(available))

    async def health_check(self) -> Dict[str, Any]:
        """
        Verifica saúde do orquestrador e modelos.
        
        Returns:
            Status de saúde detalhado
        """
        try:
            available_models = await self.get_available_models()
            model_status = {}
            
            # Verificar cada modelo
            for model_name in available_models:
                try:
                    async with self._pool.acquire(model_name) as llm:
                        is_healthy = await llm.health_check()
                        model_status[model_name] = "healthy" if is_healthy else "unhealthy"
                except Exception as e:
                    model_status[model_name] = f"error: {str(e)}"
            
            return {
                "status": "healthy",
                "models": model_status,
                "pool_stats": self._pool.get_stats(),
                "metrics": self._metrics,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Erro no health check: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }

    def get_metrics(self) -> Dict[str, Any]:
        """
        Obtém métricas do orquestrador.
        
        Returns:
            Métricas detalhadas
        """
        return {
            **self._metrics,
            "cache_size": len(self._response_cache),
            "available_contexts": list(self._context_router.keys()),
            "model_weights": self._model_weights
        }

    async def clear_cache(self) -> None:
        """Limpa cache de respostas."""
        self._response_cache.clear()
        logger.info("Cache de respostas limpo")

    # --- Métodos Privados ---

    async def _validate_available_models(self) -> None:
        """Valida se há modelos disponíveis."""
        available_models = await self.get_available_models()
        if not available_models:
            raise LLMServiceError("Nenhum modelo LLM disponível")
        
        logger.info(f"Modelos disponíveis: {available_models}")

    def _validate_configuration(self) -> None:
        """Valida configurações do orquestrador."""
        if not self._context_router:
            raise LLMServiceError("Context router não configurado")
        
        if settings.orchestrator.consensus_threshold < 0.5:
            logger.warning("Threshold de consenso muito baixo")

    async def _validate_input(self, query: str, context: str) -> None:
        """Valida entrada do usuário."""
        if not query or not query.strip():
            raise InvalidInputError("Query não pode estar vazia")
        
        if len(query) > settings.orchestrator.max_query_length:
            raise InvalidInputError(
                f"Query muito longa (max: {settings.orchestrator.max_query_length})"
            )
        
        if context not in [ctx.value for ctx in ContextType]:
            raise InvalidInputError(f"Contexto inválido: {context}")

    def _generate_cache_key(
        self,
        query: str,
        context: str,
        params: Optional[GenerationParams]
    ) -> str:
        """Gera chave para cache."""
        import hashlib
        
        param_str = ""
        if params:
            param_str = f"{params.temperature}{params.max_tokens}{params.top_p}"
        
        content = f"{query}{context}{param_str}"
        return hashlib.md5(content.encode()).hexdigest()

    def _select_models_for_context(self, context: str) -> List[str]:
        """Seleciona modelos apropriados para o contexto."""
        return self._context_router.get(
            context, 
            self._context_router[ContextType.GENERAL.value]
        )

    async def _generate_parallel_responses(
        self,
        query: str,
        context: str,
        model_names: List[str],
        params: Optional[GenerationParams]
    ) -> List[LLMResponse]:
        """Gera respostas em paralelo usando múltiplos modelos."""
        tasks = []
        
        for model_name in model_names:
            task = self._generate_single_response(query, context, model_name, params)
            tasks.append(task)
        
        # Executar com timeout
        try:
            responses = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=settings.orchestrator.request_timeout
            )
            
            # Filtrar respostas válidas
            valid_responses = []
            for response in responses:
                if isinstance(response, LLMResponse) and not response.error:
                    valid_responses.append(response)
                elif isinstance(response, Exception):
                    logger.warning(f"Erro em modelo: {response}")
            
            if not valid_responses:
                raise LLMServiceError("Nenhuma resposta válida gerada")
            
            return valid_responses
            
        except asyncio.TimeoutError:
            logger.error("Timeout na geração paralela")
            raise LLMServiceError("Timeout na geração de respostas")

    async def _generate_single_response(
        self,
        query: str,
        context: str,
        model_name: str,
        params: Optional[GenerationParams]
    ) -> LLMResponse:
        """Gera resposta usando um modelo específico."""
        try:
            async with self._pool.acquire(model_name) as llm:
                system_prompt = self._build_system_prompt(context)
                
                response = await llm.generate(
                    prompt=query,
                    context=context,
                    system_prompt=system_prompt,
                    params=params
                )
                
                # Validar qualidade da resposta
                is_valid, problems = await self._consensus_engine.validate_response_quality(
                    response.text
                )
                
                if not is_valid:
                    logger.warning(f"Problemas de qualidade em {model_name}: {problems}")
                    response.metadata = response.metadata or {}
                    response.metadata["quality_issues"] = problems
                
                return response
                
        except Exception as e:
            logger.error(f"Erro ao gerar resposta com {model_name}: {e}")
            return LLMResponse(
                text="",
                model=model_name,
                error=str(e),
                processing_time=0.0
            )

    def _build_system_prompt(self, context: str) -> str:
        """Constrói prompt do sistema baseado no contexto."""
        base_prompt = (
            "Você é um assistente jurídico especializado em legislação moçambicana. "
            "Responda de forma precisa, citando artigos relevantes quando possível."
        )
        
        context_prompts = {
            ContextType.LEGAL.value: (
                f"{base_prompt} "
                "Foque em aspectos legais específicos, cite leis e artigos relevantes."
            ),
            ContextType.TECHNICAL.value: (
                f"{base_prompt} "
                "Forneça explicações técnicas detalhadas sobre procedimentos legais."
            ),
            ContextType.BUSINESS.value: (
                f"{base_prompt} "
                "Concentre-se em aspectos comerciais e empresariais da legislação."
            ),
            ContextType.ACADEMIC.value: (
                f"{base_prompt} "
                "Forneça análise acadêmica aprofundada com referências teóricas."
            )
        }
        
        return context_prompts.get(context, base_prompt)

    def _build_context_router(self) -> Dict[str, List[str]]:
        """Constrói roteador de contexto para modelos."""
        return {
            ContextType.GENERAL.value: [
                settings.models.ollama_llama_model,
                settings.models.openrouter_qwen_model
            ],
            ContextType.LEGAL.value: [
                settings.models.ollama_llama_model,
                settings.models.cohere_model,
                settings.models.openrouter_qwen_model
            ],
            ContextType.TECHNICAL.value: [
                settings.models.openrouter_qwen_model,
                settings.models.ollama_gemma_model
            ],
            ContextType.BUSINESS.value: [
                settings.models.cohere_model,
                settings.models.openrouter_qwen_model
            ],
            ContextType.ACADEMIC.value: [
                settings.models.ollama_llama_model,
                settings.models.ollama_gemma_model,
                settings.models.openrouter_qwen_model
            ]
        }

    def _build_model_weights(self) -> Dict[str, float]:
        """Constrói pesos para diferentes modelos."""
        return {
            settings.models.ollama_llama_model: 1.0,  # Llama - peso base
            settings.models.openrouter_qwen_model: 0.9,  # Qwen - ligeiramente menor
            settings.models.cohere_model: 0.95,  # Command R+ - alto para análise
            settings.models.ollama_gemma_model: 0.85  # Gemma - validação
        }

    def _build_model_responses(self, responses: List[LLMResponse]) -> List[ModelResponse]:
        """Converte LLMResponses para ModelResponses."""
        model_responses = []
        
        for response in responses:
            # Calcular confiança baseada em qualidade
            confidence = 0.8 if not response.error else 0.1
            
            # Ajustar baseado no tempo de processamento
            if response.processing_time > 0:
                if 1.0 <= response.processing_time <= 10.0:
                    confidence += 0.1
                elif response.processing_time > 30.0:
                    confidence -= 0.1
            
            model_responses.append(ModelResponse(
                model_name=response.model,
                response_text=response.text,
                confidence=max(0.0, min(1.0, confidence)),
                processing_time=response.processing_time,
                tokens_used=response.tokens_used or 0,
                cost=response.cost or 0.0,
                error=response.error
            ))
        
        return model_responses

    def _update_metrics(
        self,
        success: bool,
        processing_time: float,
        consensus_score: float
    ) -> None:
        """Atualiza métricas do orquestrador."""
        if success:
            self._metrics["successful_requests"] += 1
            self._metrics["consensus_scores"].append(consensus_score)
        else:
            self._metrics["failed_requests"] += 1
        
        # Atualizar tempo médio de resposta
        total_requests = self._metrics["total_requests"]
        current_avg = self._metrics["avg_response_time"]
        
        new_avg = ((current_avg * (total_requests - 1)) + processing_time) / total_requests
        self._metrics["avg_response_time"] = new_avg
        
        # Manter apenas os últimos 100 scores de consenso
        if len(self._metrics["consensus_scores"]) > 100:
            self._metrics["consensus_scores"].pop(0)
