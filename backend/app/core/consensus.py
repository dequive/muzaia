# -*- coding: utf-8 -*-
"""
Módulo do Motor de Consenso com Embeddings Semânticos.

Responsável por analisar múltiplas respostas de LLMs e determinar a
melhor resposta com base em heurísticas e similaridade semântica usando
sentence transformers para análise mais sofisticada.
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
import os
import warnings

import numpy as np
from app.schemas import LLMResponse, ModelResponse

# Imports opcionais para sentence transformers
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SEMANTIC_MODELS = True
except ImportError:
    HAS_SEMANTIC_MODELS = False
    SentenceTransformer = None
    cosine_similarity = None

logger = logging.getLogger(__name__)

# Suprimir warnings do transformers para logs mais limpos
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")


class SemanticConsensusEngine:
    """
    Motor de consenso avançado usando embeddings semânticos.

    Utiliza uma abordagem híbrida, combinando:
    - Confiança inicial de cada modelo
    - Similaridade semântica entre respostas (sentence transformers)
    - Análise de qualidade de texto
    - Ponderação por performance histórica dos modelos

    Características:
    - Fallback graceful se sentence-transformers não estiver disponível
    - Cache de embeddings para performance
    - Análise assíncrona para não bloquear
    - Métricas detalhadas de consenso
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', cache_embeddings: bool = True):
        """
        Inicializa o motor de consenso com modelo de embeddings.

        Args:
            model_name: Nome do modelo sentence-transformer
            cache_embeddings: Se deve cachear embeddings para performance
        """
        self.model_name = model_name
        self.cache_embeddings = cache_embeddings
        self.embedding_model = None
        self._embedding_cache: Dict[str, np.ndarray] = {}
        self._initialized = False
        
        # Configuração de pesos para consenso
        self.semantic_weight = 0.4  # Peso da similaridade semântica
        self.confidence_weight = 0.3  # Peso da confiança inicial
        self.quality_weight = 0.2   # Peso da qualidade do texto
        self.length_weight = 0.1    # Peso do comprimento apropriado
        
        logger.info(f"Semantic Consensus Engine configurado com modelo: {model_name}")

    async def initialize(self) -> bool:
        """
        Inicializa o modelo de embeddings de forma assíncrona.
        
        Returns:
            True se inicializado com sucesso, False se usar fallback
        """
        if self._initialized:
            return self.embedding_model is not None

        if not HAS_SEMANTIC_MODELS:
            logger.warning(
                "Sentence-transformers não está disponível. "
                "Instale com: pip install sentence-transformers scikit-learn"
            )
            self._initialized = True
            return False

        try:
            # Inicializar em thread separada para não bloquear
            loop = asyncio.get_event_loop()
            self.embedding_model = await loop.run_in_executor(
                None, self._load_model
            )
            
            logger.info(f"Modelo de embedding '{self.model_name}' carregado com sucesso")
            self._initialized = True
            return True
            
        except Exception as e:
            logger.error(f"Falha ao carregar modelo '{self.model_name}': {e}")
            logger.info("Continuando com consenso baseado em heurísticas")
            self._initialized = True
            return False

    def _load_model(self) -> Optional[SentenceTransformer]:
        """Carrega modelo sentence transformer (executado em thread separada)."""
        try:
            # Configurar cache local se possível
            cache_folder = os.path.join(os.getcwd(), '.sentence_transformers_cache')
            os.makedirs(cache_folder, exist_ok=True)
            
            return SentenceTransformer(
                self.model_name,
                cache_folder=cache_folder
            )
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {e}")
            return None

    async def get_consensus(
        self, 
        responses: List[LLMResponse],
        model_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calcula consenso avançado entre múltiplas respostas.

        Args:
            responses: Lista de respostas dos modelos
            model_weights: Pesos por modelo (opcional)

        Returns:
            Dict com texto final, confiança e métricas detalhadas
        """
        if not responses:
            return {
                "text": "",
                "confidence": 0.0,
                "method": "no_responses",
                "reasoning": "Nenhuma resposta recebida.",
                "metrics": {}
            }

        if len(responses) == 1:
            response = responses[0]
            return {
                "text": response.text,
                "confidence": float(response.confidence or 0.8),
                "method": "single_response",
                "reasoning": f"Única resposta do modelo '{response.model}'.",
                "metrics": {
                    "total_responses": 1,
                    "selected_model": response.model
                }
            }

        # Garantir que modelo está inicializado
        await self.initialize()

        # Escolher método de consenso
        if self.embedding_model is not None:
            return await self._semantic_consensus(responses, model_weights)
        else:
            return await self._heuristic_consensus(responses, model_weights)

    async def _semantic_consensus(
        self, 
        responses: List[LLMResponse],
        model_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Consenso usando similaridade semântica com sentence transformers.
        """
        try:
            texts = [r.text for r in responses if r.text and r.text.strip()]
            
            if not texts:
                return await self._heuristic_consensus(responses, model_weights)

            # Gerar embeddings (com cache)
            embeddings = await self._get_embeddings(texts)
            
            # Calcular matriz de similaridade
            similarity_matrix = cosine_similarity(embeddings)
            
            # Calcular scores de consenso
            consensus_scores = await self._calculate_consensus_scores(
                responses, similarity_matrix, model_weights
            )
            
            # Selecionar melhor resposta
            best_idx = np.argmax(consensus_scores)
            best_response = responses[best_idx]
            final_confidence = float(consensus_scores[best_idx])
            
            # Calcular métricas
            metrics = self._calculate_semantic_metrics(
                responses, similarity_matrix, consensus_scores
            )
            
            reasoning = (
                f"Consenso semântico: resposta do '{best_response.model}' "
                f"selecionada com confiança {final_confidence:.3f}. "
                f"Similaridade média: {metrics['avg_similarity']:.3f}."
            )

            return {
                "text": best_response.text,
                "confidence": final_confidence,
                "method": "semantic_consensus",
                "reasoning": reasoning,
                "metrics": metrics,
                "selected_model": best_response.model,
                "alternatives": self._build_alternatives(responses, consensus_scores)
            }

        except Exception as e:
            logger.error(f"Erro no consenso semântico: {e}")
            return await self._heuristic_consensus(responses, model_weights)

    async def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Obtém embeddings para textos (com cache).
        
        Args:
            texts: Lista de textos
            
        Returns:
            Array numpy com embeddings
        """
        embeddings = []
        texts_to_encode = []
        indices_to_encode = []
        
        # Verificar cache
        for i, text in enumerate(texts):
            cache_key = hash(text)
            if self.cache_embeddings and cache_key in self._embedding_cache:
                embeddings.append(self._embedding_cache[cache_key])
            else:
                embeddings.append(None)
                texts_to_encode.append(text)
                indices_to_encode.append(i)
        
        # Encoding de textos não cacheados
        if texts_to_encode:
            loop = asyncio.get_event_loop()
            new_embeddings = await loop.run_in_executor(
                None, 
                lambda: self.embedding_model.encode(
                    texts_to_encode, 
                    convert_to_tensor=False,
                    show_progress_bar=False
                )
            )
            
            # Atualizar cache e lista
            for i, embedding in enumerate(new_embeddings):
                idx = indices_to_encode[i]
                embeddings[idx] = embedding
                
                if self.cache_embeddings:
                    cache_key = hash(texts_to_encode[i])
                    self._embedding_cache[cache_key] = embedding
        
        return np.array(embeddings)

    async def _calculate_consensus_scores(
        self,
        responses: List[LLMResponse],
        similarity_matrix: np.ndarray,
        model_weights: Optional[Dict[str, float]] = None
    ) -> np.ndarray:
        """
        Calcula scores finais de consenso combinando múltiplas métricas.
        """
        n_responses = len(responses)
        consensus_scores = []
        
        # Calcular métricas individuais
        agreement_scores = np.mean(similarity_matrix, axis=1)
        confidence_scores = np.array([r.confidence or 0.5 for r in responses])
        quality_scores = np.array([self._calculate_quality_score(r.text) for r in responses])
        length_scores = np.array([self._calculate_length_score(r.text) for r in responses])
        
        # Normalizar scores para [0, 1]
        agreement_scores = self._normalize_scores(agreement_scores)
        confidence_scores = self._normalize_scores(confidence_scores)
        quality_scores = self._normalize_scores(quality_scores)
        length_scores = self._normalize_scores(length_scores)
        
        # Combinar com pesos
        for i in range(n_responses):
            # Peso do modelo (se especificado)
            model_weight = 1.0
            if model_weights and responses[i].model in model_weights:
                model_weight = model_weights[responses[i].model]
            
            # Score final ponderado
            final_score = (
                self.semantic_weight * agreement_scores[i] +
                self.confidence_weight * confidence_scores[i] +
                self.quality_weight * quality_scores[i] +
                self.length_weight * length_scores[i]
            ) * model_weight
            
            consensus_scores.append(final_score)
        
        return np.array(consensus_scores)

    def _calculate_quality_score(self, text: str) -> float:
        """
        Calcula score de qualidade do texto baseado em heurísticas.
        
        Args:
            text: Texto a analisar
            
        Returns:
            Score de qualidade entre 0 e 1
        """
        if not text or not text.strip():
            return 0.0
        
        text = text.strip()
        quality_score = 0.5  # Base
        
        # Comprimento apropriado (nem muito curto nem muito longo)
        length = len(text)
        if 100 <= length <= 2000:
            quality_score += 0.2
        elif length < 50:
            quality_score -= 0.2
        
        # Estrutura (frases completas)
        sentences = text.count('.') + text.count('!') + text.count('?')
        if sentences >= 2:
            quality_score += 0.1
        
        # Variedade de palavras
        words = text.split()
        if len(words) > 0:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio > 0.7:
                quality_score += 0.1
        
        # Penalizar repetições excessivas
        if len(words) > 10:
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            
            max_repetition = max(word_counts.values()) if word_counts else 1
            repetition_ratio = max_repetition / len(words)
            if repetition_ratio > 0.3:
                quality_score -= 0.2
        
        # Presença de caracteres especiais problemáticos
        if '�' in text or '\ufffd' in text:
            quality_score -= 0.3
        
        return max(0.0, min(1.0, quality_score))

    def _calculate_length_score(self, text: str) -> float:
        """Calcula score baseado no comprimento apropriado."""
        if not text:
            return 0.0
        
        length = len(text.strip())
        
        # Comprimento ideal entre 200-1000 caracteres
        if 200 <= length <= 1000:
            return 1.0
        elif 100 <= length < 200 or 1000 < length <= 2000:
            return 0.7
        elif 50 <= length < 100 or 2000 < length <= 3000:
            return 0.5
        else:
            return 0.2

    def _normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """Normaliza scores para intervalo [0, 1]."""
        if len(scores) == 0:
            return scores
        
        min_score = np.min(scores)
        max_score = np.max(scores)
        
        if max_score == min_score:
            return np.ones_like(scores) * 0.5
        
        return (scores - min_score) / (max_score - min_score)

    def _calculate_semantic_metrics(
        self,
        responses: List[LLMResponse],
        similarity_matrix: np.ndarray,
        consensus_scores: np.ndarray
    ) -> Dict[str, Any]:
        """Calcula métricas detalhadas do consenso semântico."""
        n_responses = len(responses)
        
        # Similaridade média geral
        avg_similarity = np.mean(similarity_matrix)
        
        # Diversidade (1 - similaridade média)
        diversity = 1.0 - avg_similarity
        
        # Consenso (quão próximos estão os scores)
        consensus_variance = np.var(consensus_scores)
        consensus_strength = 1.0 - min(consensus_variance, 1.0)
        
        # Outliers (respostas muito diferentes)
        agreement_scores = np.mean(similarity_matrix, axis=1)
        outlier_threshold = np.mean(agreement_scores) - np.std(agreement_scores)
        outliers = [
            responses[i].model for i, score in enumerate(agreement_scores)
            if score < outlier_threshold
        ]
        
        return {
            "total_responses": n_responses,
            "avg_similarity": float(avg_similarity),
            "diversity": float(diversity),
            "consensus_strength": float(consensus_strength),
            "consensus_variance": float(consensus_variance),
            "outliers": outliers,
            "similarity_matrix_shape": similarity_matrix.shape,
            "method": "semantic_transformers"
        }

    async def _heuristic_consensus(
        self,
        responses: List[LLMResponse],
        model_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Consenso baseado em heurísticas (fallback).
        """
        # Calcular scores heurísticos
        scores = []
        for response in responses:
            confidence = response.confidence or 0.5
            quality = self._calculate_quality_score(response.text)
            length = self._calculate_length_score(response.text)
            
            # Peso do modelo
            model_weight = 1.0
            if model_weights and response.model in model_weights:
                model_weight = model_weights[response.model]
            
            # Score combinado
            score = (
                0.5 * confidence +
                0.3 * quality +
                0.2 * length
            ) * model_weight
            
            scores.append(score)
        
        # Selecionar melhor
        best_idx = np.argmax(scores)
        best_response = responses[best_idx]
        final_confidence = float(scores[best_idx])
        
        reasoning = (
            f"Consenso heurístico: '{best_response.model}' "
            f"selecionado com score {final_confidence:.3f} "
            f"(confiança: {best_response.confidence:.3f}, qualidade estimada)."
        )
        
        return {
            "text": best_response.text,
            "confidence": final_confidence,
            "method": "heuristic_consensus",
            "reasoning": reasoning,
            "metrics": {
                "total_responses": len(responses),
                "selected_model": best_response.model,
                "avg_confidence": float(np.mean([r.confidence or 0.5 for r in responses])),
                "method": "heuristics_only"
            },
            "alternatives": self._build_alternatives(responses, scores)
        }

    def _build_alternatives(
        self, 
        responses: List[LLMResponse], 
        scores: List[float]
    ) -> List[Dict[str, Any]]:
        """Constrói lista de respostas alternativas ordenadas por score."""
        alternatives = []
        
        # Ordenar por score (descending)
        sorted_indices = np.argsort(scores)[::-1]
        
        for i, idx in enumerate(sorted_indices[:3]):  # Top 3
            response = responses[idx]
            alternatives.append({
                "rank": i + 1,
                "model": response.model,
                "score": float(scores[idx]),
                "confidence": float(response.confidence or 0.5),
                "text_preview": response.text[:100] + "..." if len(response.text) > 100 else response.text
            })
        
        return alternatives

    def get_cache_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache de embeddings."""
        return {
            "cache_enabled": self.cache_embeddings,
            "cache_size": len(self._embedding_cache),
            "model_loaded": self.embedding_model is not None,
            "model_name": self.model_name,
            "weights": {
                "semantic": self.semantic_weight,
                "confidence": self.confidence_weight,
                "quality": self.quality_weight,
                "length": self.length_weight
            }
        }

    def clear_cache(self):
        """Limpa cache de embeddings."""
        self._embedding_cache.clear()
        logger.info("Cache de embeddings limpo")

    async def close(self):
        """Limpa recursos do modelo."""
        if self.embedding_model:
            # Sentence transformers não precisa de cleanup específico
            self.embedding_model = None
        
        self.clear_cache()
        logger.info("Semantic Consensus Engine fechado")


# Instância global (opcional)
semantic_consensus_engine = SemanticConsensusEngine()
