# backend/app/core/consensus.py

# -*- coding: utf-8 -*-
"""
Módulo do Motor de Consenso.

Responsável por analisar múltiplas respostas de LLMs e determinar a
melhor resposta com base em heurísticas e similaridade semântica.
"""
import logging
from typing import List, Dict, Any, Optional

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.schemas import LLMResponse

log = logging.getLogger(__name__)

class ConsensusEngine:
    """
    Analisa um conjunto de respostas de LLMs para encontrar a mais representativa.

    Utiliza uma abordagem híbrida, combinando a confiança inicial de cada modelo
    com uma pontuação de "acordo" calculada através de similaridade semântica
    entre as respostas.
    """
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Inicializa o motor de consenso, carregando o modelo de sentence embedding.

        Args:
            model_name: O nome do modelo de sentence-transformer a ser usado.
                        'all-MiniLM-L6-v2' é um bom ponto de partida, rápido e eficaz.
        """
        try:
            self.embedding_model = SentenceTransformer(model_name)
            log.info(f"Motor de Consenso inicializado com o modelo de embedding: '{model_name}'")
        except Exception as e:
            log.error(f"Falha ao carregar o modelo de embedding '{model_name}'. O consenso será baseado apenas em confiança. Erro: {e}")
            self.embedding_model = None

    def get_consensus(self, responses: List[LLMResponse]) -> Dict[str, Any]:
        """
        Calcula a melhor resposta a partir de uma lista de respostas de LLMs.

        Se houver apenas uma resposta, retorna-a diretamente.
        Se o modelo de embedding estiver disponível, calcula a similaridade semântica.
        Caso contrário, recorre à escolha da resposta com a maior confiança inicial.

        Args:
            responses: Uma lista de objetos LLMResponse.

        Returns:
            Um dicionário contendo o texto da melhor resposta e a confiança final.
        """
        if not responses:
            return {"text": "", "confidence": 0.0, "reasoning": "Nenhuma resposta recebida."}

        if len(responses) == 1:
            best_response = responses[0]
            return {
                "text": best_response.text,
                "confidence": best_response.confidence,
                "reasoning": f"Apenas uma resposta recebida do modelo '{best_response.model_name}'."
            }

        # Fallback se o modelo de embedding não pôde ser carregado
        if not self.embedding_model:
            log.warning("Modelo de embedding não disponível. Usando fallback para consenso baseado em confiança.")
            return self._fallback_consensus(responses)

        return self._semantic_consensus(responses)

    def _semantic_consensus(self, responses: List[LLMResponse]) -> Dict[str, Any]:
        """
        Encontra o consenso usando similaridade de cosseno entre os embeddings das respostas.
        """
        texts = [r.text for r in responses]
        
        # 1. Gerar embeddings para todas as respostas de texto
        embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
        
        # 2. Calcular a matriz de similaridade de cosseno (pairwise)
        # O resultado é uma matriz NxN onde M[i, j] é a similaridade entre a resposta i e j.
        similarity_matrix = cosine_similarity(embeddings)
        
        # 3. Calcular a pontuação de "acordo" para cada resposta
        # A pontuação de acordo de uma resposta é a sua similaridade média com todas as outras.
        # np.mean com axis=1 calcula a média de cada linha.
        agreement_scores = np.mean(similarity_matrix, axis=1)

        # 4. Calcular a pontuação final de confiança
        # Combina a confiança inicial (heurística) com a pontuação de acordo semântico.
        # Damos mais peso ao acordo semântico (ex: 70%) do que à confiança inicial (30%).
        final_confidences = []
        for i, response in enumerate(responses):
            initial_confidence = response.confidence
            agreement_score = agreement_scores[i]
            
            # Fórmula de ponderação
            final_confidence = (0.7 * agreement_score) + (0.3 * initial_confidence)
            final_confidences.append(final_confidence)

        # 5. Encontrar o índice da melhor resposta
        best_response_index = np.argmax(final_confidences)
        best_response = responses[best_response_index]
        final_confidence_score = final_confidences[best_response_index]
        
        reasoning = (
            f"Consenso determinado por similaridade semântica. "
            f"A resposta do modelo '{best_response.model_name}' teve a maior pontuação de acordo "
            f"({agreement_scores[best_response_index]:.2f}) "
            f"resultando na confiança final de {final_confidence_score:.2f}."
        )

        return {
            "text": best_response.text,
            "confidence": float(final_confidence_score),
            "reasoning": reasoning
        }

    def _fallback_consensus(self, responses: List[LLMResponse]) -> Dict[str, Any]:
        """
        Método de fallback que simplesmente escolhe a resposta com a maior confiança inicial.
        """
        best_response = max(responses, key=lambda r: r.confidence)
        reasoning = (
            "Consenso baseado em fallback (maior confiança inicial), "
            f"pois o modelo de embedding não estava disponível. "
            f"Modelo escolhido: '{best_response.model_name}'."
        )
        return {
            "text": best_response.text,
            "confidence": best_response.confidence,
            "reasoning": reasoning
        }
