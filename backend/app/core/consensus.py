# backend/app/core/consensus.py

import difflib
from statistics import mean
from typing import List, Dict, Any

from app.schemas import LLMResponse
from app.core.exceptions import ConsensusError

class ConsensusEngine:
    """
    Consolida e valida respostas de múltiplos LLMs para gerar uma resposta final.
    """
    def __init__(self, min_similarity_threshold: float = 0.65):
        self._threshold = min_similarity_threshold

    def get_consensus(self, responses: List[LLMResponse]) -> Dict[str, Any]:
        """
        Aplica um algoritmo de consenso para fundir múltiplas respostas de LLM.

        Args:
            responses: Uma lista de respostas de LLM válidas.

        Returns:
            Um dicionário com o texto final, a pontuação de confiança e as fontes.
        
        Raises:
            ConsensusError: Se não houver respostas ou se a divergência for muito alta.
        """
        if not responses:
            raise ConsensusError("Nenhuma resposta válida recebida para o processo de consenso.")

        if len(responses) == 1:
            resp = responses[0]
            return {
                "text": resp.text,
                "confidence": resp.confidence,
                "sources": resp.metadata.get("sources", []),
                "reasoning": f"Consenso direto: Apenas um modelo ({resp.model_name}) respondeu."
            }

        # Usa a resposta mais longa como base para a comparação
        base_response = max(responses, key=lambda r: len(r.text))
        other_responses = [r for r in responses if r is not base_response]

        similarities = [
            difflib.SequenceMatcher(None, base_response.text, r.text).ratio()
            for r in other_responses
        ]
        avg_similarity = mean(similarities) if similarities else 1.0

        if avg_similarity < self._threshold:
            raise ConsensusError(f"Baixa concordância entre modelos. Similaridade média: {avg_similarity:.2f}")

        # Calcula a confiança final como uma média ponderada pela confiança de cada modelo
        total_confidence_sum = sum(r.confidence for r in responses)
        if total_confidence_sum == 0: total_confidence_sum = 1.0 # Evitar divisão por zero

        final_confidence = sum(r.confidence**2 for r in responses) / total_confidence_sum
        
        all_sources = list(set(src for r in responses for src in r.metadata.get("sources", [])))
        
        reasoning = (
            f"Consenso baseado em {len(responses)} respostas com similaridade média de {avg_similarity:.2f}. "
            f"A resposta de '{base_response.model_name}' foi usada como base."
        )

        return {
            "text": base_response.text,
            "confidence": min(final_confidence, 0.99), # Limitar confiança máxima a 99%
            "sources": all_sources,
            "reasoning": reasoning
        }
