# -*- coding: utf-8 -*-
"""
Motor de Consenso Avançado - Versão Híbrida.

Combina o motor de consenso original (heurística avançada) com
o novo motor semântico (sentence transformers) para máxima precisão.
"""
from __future__ import annotations

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from statistics import mean

from app.schemas import LLMResponse, ModelResponse
from app.core.exceptions import ConsensusError

# Import condicional do motor semântico
try:
    from app.core.consensus import SemanticConsensusEngine
    HAS_SEMANTIC_ENGINE = True
except ImportError:
    HAS_SEMANTIC_ENGINE = False
    SemanticConsensusEngine = None

logger = logging.getLogger(__name__)


class HybridConsensusEngine:
    """
    Motor de consenso híbrido que combina múltiplas abordagens.
    
    Estratégias disponíveis:
    1. Consenso Semântico (sentence transformers) - mais preciso
    2. Consenso Heurístico Avançado - mais rápido
    3. Consenso Simples - fallback
    
    Seleciona automaticamente a melhor estratégia baseada em:
    - Disponibilidade de dependências
    - Número de respostas
    - Configuração do usuário
    """

    def __init__(
        self,
        prefer_semantic: bool = True,
        min_similarity: float = 0.6,
        min_consensus: float = 0.7,
        semantic_model: str = 'all-MiniLM-L6-v2'
    ):
        """
        Inicializa motor de consenso híbrido.
        
        Args:
            prefer_semantic: Preferir consenso semântico quando disponível
            min_similarity: Similaridade mínima entre respostas
            min_consensus: Score mínimo para consenso válido
            semantic_model: Modelo para embeddings semânticos
        """
        self.prefer_semantic = prefer_semantic
        self.min_similarity = min_similarity
        self.min_consensus = min_consensus
        
        # Inicializar motores
        self.semantic_engine = None
        if HAS_SEMANTIC_ENGINE and prefer_semantic:
            self.semantic_engine = SemanticConsensusEngine(
                model_name=semantic_model,
                cache_embeddings=True
            )
        
        self.response_cache: Dict[str, float] = {}
        self.metrics = {
            "total_consensus_calls": 0,
            "semantic_consensus_used": 0,
            "heuristic_consensus_used": 0,
            "simple_consensus_used": 0,
            "avg_processing_time": 0.0
        }
        
        logger.info(
            f"Hybrid Consensus Engine inicializado "
            f"(semantic: {self.semantic_engine is not None})"
        )

    async def initialize(self) -> None:
        """Inicializa componentes assíncronos."""
        if self.semantic_engine:
            success = await self.semantic_engine.initialize()
            if not success:
                logger.warning("Semantic engine falhou, usando apenas heurística")
                self.semantic_engine = None

    async def calculate_consensus(
        self, 
        responses: List[LLMResponse],
        weights: Optional[Dict[str, float]] = None,
        strategy: Optional[str] = None
    ) -> Tuple[float, ModelResponse]:
        """
        Calcula consenso usando estratégia híbrida.
        
        Args:
            responses: Lista de respostas dos modelos
            weights: Pesos opcionais por modelo
            strategy: Estratégia específica ('semantic', 'heuristic', 'simple')
            
        Returns:
            Tuple com (score_consenso, melhor_resposta)
        """
        import time
        start_time = time.time()
        
        try:
            self.metrics["total_consensus_calls"] += 1
            
            if not responses:
                raise ConsensusError("Lista de respostas vazia")
            
            if len(responses) == 1:
                return 0.6, self._llm_to_model_response(responses[0])
            
            # Determinar estratégia
            chosen_strategy = self._choose_strategy(responses, strategy)
            logger.debug(f"Usando estratégia de consenso: {chosen_strategy}")
            
            # Executar consenso
            if chosen_strategy == "semantic":
                consensus_result = await self._semantic_consensus(responses, weights)
                self.metrics["semantic_consensus_used"] += 1
                
            elif chosen_strategy == "heuristic":
                consensus_result = await self._heuristic_consensus(responses, weights)
                self.metrics["heuristic_consensus_used"] += 1
                
            else:  # simple
                consensus_result = await self._simple_consensus(responses, weights)
                self.metrics["simple_consensus_used"] += 1
            
            # Extrair resultado
            final_consensus = consensus_result["confidence"]
            best_response = self._create_model_response_from_result(consensus_result)
            
            # Atualizar métricas
            processing_time = time.time() - start_time
            self._update_processing_metrics(processing_time)
            
            logger.info(
                f"Consenso calculado: {final_consensus:.3f} "
                f"usando {chosen_strategy} em {processing_time:.3f}s"
            )
            
            return final_consensus, best_response
            
        except Exception as e:
            logger.error(f"Erro no cálculo de consenso: {e}")
            raise ConsensusError(f"Erro no cálculo de consenso: {str(e)}")

    def _choose_strategy(
        self, 
        responses: List[LLMResponse], 
        forced_strategy: Optional[str]
    ) -> str:
        """Escolhe a melhor estratégia para consenso."""
        
        if forced_strategy:
            return forced_strategy
        
        # Se semantic engine disponível e preferido
        if self.semantic_engine and self.prefer_semantic:
            # Usar semântico apenas se houver texto suficiente
            text_lengths = [len(r.text) for r in responses if r.text]
            if text_lengths and mean(text_lengths) > 50:
                return "semantic"
        
        # Se há pelo menos 2 respostas válidas, usar heurística
        valid_responses = [r for r in responses if not r.error and r.text.strip()]
        if len(valid_responses) >= 2:
            return "heuristic"
        
        # Fallback para consenso simples
        return "simple"

    async def _semantic_consensus(
        self,
        responses: List[LLMResponse],
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Consenso usando motor semântico."""
        try:
            result = await self.semantic_engine.get_consensus(responses, weights)
            
            # Garantir que temos ModelResponse compatível
            if "selected_model" in result:
                # Encontrar resposta original
                selected_response = None
                for r in responses:
                    if r.model == result["selected_model"]:
                        selected_response = r
                        break
                
                if selected_response:
                    result["original_response"] = selected_response
            
            return result
            
        except Exception as e:
            logger.error(f"Erro no consenso semântico: {e}")
            # Fallback para heurística
            return await self._heuristic_consensus(responses, weights)

    async def _heuristic_consensus(
        self,
        responses: List[LLMResponse],
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Consenso usando heurística avançada (motor original)."""
        
        # Usar lógica do motor original de consensus_engine
        valid_responses = [r for r in responses if not r.error and r.text.strip()]
        
        if not valid_responses:
            raise ConsensusError("Nenhuma resposta válida encontrada")
        
        if len(valid_responses) == 1:
            response = valid_responses[0]
            return {
                "text": response.text,
                "confidence": 0.6,
                "method": "single_valid_response",
                "reasoning": f"Apenas uma resposta válida de {response.model}",
                "original_response": response
            }
        
        # Calcular similaridades usando difflib (do motor original)
        import difflib
        similarity_matrix = []
        
        for i, resp1 in enumerate(valid_responses):
            row = []
            for j, resp2 in enumerate(valid_responses):
                if i == j:
                    similarity = 1.0
                else:
                    similarity = difflib.SequenceMatcher(
                        None, 
                        resp1.text.lower(), 
                        resp2.text.lower()
                    ).ratio()
                row.append(similarity)
            similarity_matrix.append(row)
        
        # Calcular scores de consenso
        consensus_scores = []
        for i, response in enumerate(valid_responses):
            # Similaridade média
            avg_similarity = mean(similarity_matrix[i])
            
            # Qualidade do texto
            quality_score = self._calculate_text_quality(response.text)
            
            # Peso do modelo
            model_weight = weights.get(response.model, 1.0) if weights else 1.0
            
            # Score final
            final_score = (
                0.4 * avg_similarity +
                0.3 * (response.confidence or 0.5) +
                0.2 * quality_score +
                0.1 * model_weight
            )
            
            consensus_scores.append(final_score)
        
        # Selecionar melhor resposta
        best_idx = max(range(len(consensus_scores)), key=lambda i: consensus_scores[i])
        best_response = valid_responses[best_idx]
        final_confidence = consensus_scores[best_idx]
        
        return {
            "text": best_response.text,
            "confidence": final_confidence,
            "method": "heuristic_advanced",
            "reasoning": f"Consenso heurístico: {best_response.model} com score {final_confidence:.3f}",
            "original_response": best_response,
            "metrics": {
                "avg_similarity": mean([mean(row) for row in similarity_matrix]),
                "total_responses": len(valid_responses)
            }
        }

    async def _simple_consensus(
        self,
        responses: List[LLMResponse],
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Consenso simples baseado em confiança."""
        
        # Filtrar respostas válidas
        valid_responses = [r for r in responses if r.text and r.text.strip()]
        
        if not valid_responses:
            # Usar qualquer resposta disponível
            valid_responses = responses
        
        if not valid_responses:
            raise ConsensusError("Nenhuma resposta disponível")
        
        # Calcular scores simples
        scores = []
        for response in valid_responses:
            confidence = response.confidence or 0.5
            length_bonus = min(len(response.text) / 1000, 0.2)  # Bônus por comprimento
            model_weight = weights.get(response.model, 1.0) if weights else 1.0
            
            score = (confidence + length_bonus) * model_weight
            scores.append(score)
        
        # Selecionar melhor
        best_idx = max(range(len(scores)), key=lambda i: scores[i])
        best_response = valid_responses[best_idx]
        
        return {
            "text": best_response.text,
            "confidence": min(scores[best_idx], 1.0),
            "method": "simple_confidence",
            "reasoning": f"Consenso simples: maior confiança ({best_response.model})",
            "original_response": best_response
        }

    def _calculate_text_quality(self, text: str) -> float:
        """Calcula qualidade básica do texto."""
        if not text or not text.strip():
            return 0.0
        
        text = text.strip()
        score = 0.5
        
        # Comprimento apropriado
        length = len(text)
        if 100 <= length <= 2000:
            score += 0.3
        elif length < 50:
            score -= 0.2
        
        # Estrutura básica
        sentences = text.count('.') + text.count('!') + text.count('?')
        if sentences >= 2:
            score += 0.2
        
        return max(0.0, min(1.0, score))

    def _create_model_response_from_result(self, result: Dict[str, Any]) -> ModelResponse:
        """Cria ModelResponse a partir do resultado do consenso."""
        
        original_response = result.get("original_response")
        
        if original_response:
            return ModelResponse(
                model_name=original_response.model,
                response_text=result["text"],
                confidence=result["confidence"],
                processing_time=original_response.processing_time,
                tokens_used=original_response.tokens_used or 0,
                cost=original_response.cost or 0.0
            )
        else:
            return ModelResponse(
                model_name="consensus",
                response_text=result["text"],
                confidence=result["confidence"],
                processing_time=0.0,
                tokens_used=0,
                cost=0.0
            )

    def _llm_to_model_response(self, llm_response: LLMResponse) -> ModelResponse:
        """Converte LLMResponse para ModelResponse."""
        return ModelResponse(
            model_name=llm_response.model,
            response_text=llm_response.text,
            confidence=0.8,
            processing_time=llm_response.processing_time,
            tokens_used=llm_response.tokens_used or 0,
            cost=llm_response.cost or 0.0
        )

    def _update_processing_metrics(self, processing_time: float):
        """Atualiza métricas de tempo de processamento."""
        current_avg = self.metrics["avg_processing_time"]
        total_calls = self.metrics["total_consensus_calls"]
        
        new_avg = ((current_avg * (total_calls - 1)) + processing_time) / total_calls
        self.metrics["avg_processing_time"] = new_avg

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas do motor híbrido."""
        base_metrics = dict(self.metrics)
        
        # Adicionar métricas do semantic engine se disponível
        if self.semantic_engine:
            base_metrics["semantic_cache_stats"] = self.semantic_engine.get_cache_stats()
        
        return {
            **base_metrics,
            "semantic_engine_available": self.semantic_engine is not None,
            "strategy_distribution": {
                "semantic_percentage": (
                    self.metrics["semantic_consensus_used"] / 
                    max(self.metrics["total_consensus_calls"], 1) * 100
                ),
                "heuristic_percentage": (
                    self.metrics["heuristic_consensus_used"] / 
                    max(self.metrics["total_consensus_calls"], 1) * 100
                ),
                "simple_percentage": (
                    self.metrics["simple_consensus_used"] / 
                    max(self.metrics["total_consensus_calls"], 1) * 100
                )
            }
        }

    async def close(self):
        """Limpa recursos."""
        if self.semantic_engine:
            await self.semantic_engine.close()


# Alias para backward compatibility
ConsensusEngine = HybridConsensusEngine
