# -*- coding: utf-8 -*-
"""
Motor de Consenso Avançado para Validação Multi-Modelo.

Implementa algoritmos sofisticados para:
- Scoring de similaridade semântica
- Detecção de consenso entre modelos
- Merge inteligente de respostas
- Validação de qualidade
"""
from __future__ import annotations

import difflib
import logging
import re
from statistics import mean, median
from typing import List, Dict, Any, Optional, Tuple
import asyncio
import hashlib

from app.schemas import LLMResponse, ModelResponse
from app.core.exceptions import ConsensusError

logger = logging.getLogger(__name__)


class ConsensusEngine:
    """
    Motor de consenso para validação multi-modelo.
    
    Características:
    - Análise semântica de similaridade
    - Scoring ponderado por confiança
    - Detecção de outliers
    - Merge inteligente de respostas
    """

    def __init__(self, min_similarity: float = 0.6, min_consensus: float = 0.7):
        """
        Inicializa o motor de consenso.
        
        Args:
            min_similarity: Similaridade mínima entre respostas
            min_consensus: Score mínimo para consenso válido
        """
        self.min_similarity = min_similarity
        self.min_consensus = min_consensus
        self.response_cache: Dict[str, float] = {}

    async def calculate_consensus(
        self, 
        responses: List[LLMResponse],
        weights: Optional[Dict[str, float]] = None
    ) -> Tuple[float, ModelResponse]:
        """
        Calcula consenso entre múltiplas respostas LLM.
        
        Args:
            responses: Lista de respostas dos modelos
            weights: Pesos opcionais por modelo
            
        Returns:
            Tuple com (score_consenso, melhor_resposta)
            
        Raises:
            ConsensusError: Se não conseguir calcular consenso
        """
        if not responses:
            raise ConsensusError("Lista de respostas vazia")
        
        if len(responses) == 1:
            return 0.5, self._llm_to_model_response(responses[0])
        
        try:
            # 1. Filtrar respostas válidas
            valid_responses = [r for r in responses if not r.error and r.text.strip()]
            
            if not valid_responses:
                raise ConsensusError("Nenhuma resposta válida encontrada")
            
            if len(valid_responses) == 1:
                return 0.6, self._llm_to_model_response(valid_responses[0])
            
            # 2. Calcular similaridades entre todas as respostas
            similarity_matrix = await self._calculate_similarity_matrix(valid_responses)
            
            # 3. Calcular scores de consenso
            consensus_scores = self._calculate_consensus_scores(
                similarity_matrix, valid_responses, weights
            )
            
            # 4. Encontrar melhor resposta
            best_response = self._select_best_response(valid_responses, consensus_scores)
            
            # 5. Calcular score final de consenso
            final_consensus = self._calculate_final_consensus(
                similarity_matrix, consensus_scores, valid_responses
            )
            
            logger.info(
                f"Consenso calculado: {final_consensus:.3f} "
                f"({len(valid_responses)} modelos)"
            )
            
            return final_consensus, best_response
            
        except Exception as e:
            logger.error(f"Erro no cálculo de consenso: {e}")
            raise ConsensusError(f"Erro no cálculo de consenso: {str(e)}")

    async def merge_responses(
        self, 
        responses: List[LLMResponse],
        consensus_score: float,
        best_response: ModelResponse
    ) -> str:
        """
        Mescla respostas usando consenso para gerar resposta final.
        
        Args:
            responses: Lista de respostas originais
            consensus_score: Score de consenso calculado
            best_response: Melhor resposta identificada
            
        Returns:
            Texto final mesclado
        """
        try:
            valid_responses = [r for r in responses if not r.error and r.text.strip()]
            
            if not valid_responses:
                return best_response.response_text
            
            # Se consenso alto, usar melhor resposta
            if consensus_score >= 0.8:
                return best_response.response_text
            
            # Se consenso médio, enriquecer com informações adicionais
            elif consensus_score >= 0.6:
                return await self._enrich_response(best_response, valid_responses)
            
            # Se consenso baixo, indicar incerteza
            else:
                enriched = await self._enrich_response(best_response, valid_responses)
                return (
                    f"{enriched}\n\n"
                    f"⚠️ Nota: Esta resposta tem baixo consenso entre modelos "
                    f"({consensus_score:.1%}) e pode necessitar de revisão."
                )
                
        except Exception as e:
            logger.error(f"Erro no merge de respostas: {e}")
            return best_response.response_text

    async def detect_outliers(self, responses: List[LLMResponse]) -> List[str]:
        """
        Detecta respostas que são outliers (muito diferentes das outras).
        
        Args:
            responses: Lista de respostas para analisar
            
        Returns:
            Lista de modelos identificados como outliers
        """
        if len(responses) < 3:
            return []
        
        try:
            valid_responses = [r for r in responses if not r.error and r.text.strip()]
            
            if len(valid_responses) < 3:
                return []
            
            similarity_matrix = await self._calculate_similarity_matrix(valid_responses)
            outliers = []
            
            for i, response in enumerate(valid_responses):
                # Calcular similaridade média com outras respostas
                similarities = [
                    similarity_matrix[i][j] 
                    for j in range(len(valid_responses)) 
                    if i != j
                ]
                
                avg_similarity = mean(similarities)
                
                # Se similaridade média muito baixa, é outlier
                if avg_similarity < self.min_similarity:
                    outliers.append(response.model)
                    logger.warning(
                        f"Outlier detectado: {response.model} "
                        f"(similaridade média: {avg_similarity:.3f})"
                    )
            
            return outliers
            
        except Exception as e:
            logger.error(f"Erro na detecção de outliers: {e}")
            return []

    async def validate_response_quality(
        self, 
        response: str, 
        min_length: int = 50
    ) -> Tuple[bool, List[str]]:
        """
        Valida a qualidade de uma resposta.
        
        Args:
            response: Texto da resposta
            min_length: Comprimento mínimo esperado
            
        Returns:
            Tuple com (é_válida, lista_problemas)
        """
        problems = []
        
        try:
            # Verificar comprimento mínimo
            if len(response.strip()) < min_length:
                problems.append(f"Resposta muito curta ({len(response)} caracteres)")
            
            # Verificar se não é apenas repetição
            if self._is_repetitive(response):
                problems.append("Resposta contém muita repetição")
            
            # Verificar se tem estrutura básica
            if not self._has_basic_structure(response):
                problems.append("Resposta sem estrutura clara")
            
            # Verificar encoding e caracteres especiais
            if self._has_encoding_issues(response):
                problems.append("Problemas de encoding detectados")
            
            # Verificar se parece resposta de erro
            if self._looks_like_error(response):
                problems.append("Resposta parece ser mensagem de erro")
            
            is_valid = len(problems) == 0
            
            if not is_valid:
                logger.warning(f"Problemas de qualidade detectados: {problems}")
            
            return is_valid, problems
            
        except Exception as e:
            logger.error(f"Erro na validação de qualidade: {e}")
            return False, [f"Erro na validação: {str(e)}"]

    # --- Métodos Privados ---

    async def _calculate_similarity_matrix(
        self, 
        responses: List[LLMResponse]
    ) -> List[List[float]]:
        """Calcula matriz de similaridade entre respostas."""
        n = len(responses)
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]
        
        # Cache para evitar recálculos
        for i in range(n):
            for j in range(i, n):
                if i == j:
                    matrix[i][j] = 1.0
                else:
                    similarity = await self._calculate_semantic_similarity(
                        responses[i].text, responses[j].text
                    )
                    matrix[i][j] = similarity
                    matrix[j][i] = similarity
        
        return matrix

    async def _calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Calcula similaridade semântica entre dois textos.
        
        Combina múltiplas métricas:
        - Similaridade de sequência (difflib)
        - Sobreposição de palavras-chave
        - Estrutura de frases
        """
        # Cache baseado em hash dos textos
        cache_key = hashlib.md5(f"{text1}||{text2}".encode()).hexdigest()
        if cache_key in self.response_cache:
            return self.response_cache[cache_key]
        
        # Normalizar textos
        norm_text1 = self._normalize_text(text1)
        norm_text2 = self._normalize_text(text2)
        
        # 1. Similaridade de sequência básica
        sequence_sim = difflib.SequenceMatcher(None, norm_text1, norm_text2).ratio()
        
        # 2. Similaridade de palavras-chave
        keyword_sim = self._calculate_keyword_similarity(norm_text1, norm_text2)
        
        # 3. Similaridade estrutural
        structure_sim = self._calculate_structure_similarity(text1, text2)
        
        # 4. Similaridade de conceitos jurídicos (se aplicável)
        legal_sim = self._calculate_legal_concept_similarity(norm_text1, norm_text2)
        
        # Combinar métricas com pesos
        final_similarity = (
            sequence_sim * 0.3 +
            keyword_sim * 0.3 +
            structure_sim * 0.2 +
            legal_sim * 0.2
        )
        
        # Cache resultado
        self.response_cache[cache_key] = final_similarity
        
        return final_similarity

    def _normalize_text(self, text: str) -> str:
        """Normaliza texto para comparação."""
        # Remover caracteres especiais e normalizar espaços
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s]', '', text)
        return text.lower().strip()

    def _calculate_keyword_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade baseada em palavras-chave."""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0

    def _calculate_structure_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade estrutural (parágrafos, listas, etc.)."""
        # Contar elementos estruturais
        def count_structures(text):
            return {
                'paragraphs': len(text.split('\n\n')),
                'sentences': len(re.findall(r'[.!?]+', text)),
                'lists': len(re.findall(r'^\s*[-*]\s', text, re.MULTILINE)),
                'numbers': len(re.findall(r'\d+', text))
            }
        
        struct1 = count_structures(text1)
        struct2 = count_structures(text2)
        
        similarities = []
        for key in struct1:
            if struct1[key] == 0 and struct2[key] == 0:
                similarities.append(1.0)
            elif struct1[key] == 0 or struct2[key] == 0:
                similarities.append(0.0)
            else:
                sim = min(struct1[key], struct2[key]) / max(struct1[key], struct2[key])
                similarities.append(sim)
        
        return mean(similarities) if similarities else 0.0

    def _calculate_legal_concept_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade baseada em conceitos jurídicos."""
        # Termos jurídicos comuns em português/moçambicano
        legal_terms = {
            'artigo', 'lei', 'código', 'decreto', 'constituição', 'tribunal',
            'processo', 'sentença', 'acórdão', 'recurso', 'jurisdição',
            'competência', 'procedimento', 'direito', 'obrigação', 'contrato',
            'responsabilidade', 'dano', 'reparação', 'prova', 'testemunha'
        }
        
        def extract_legal_concepts(text):
            words = set(text.split())
            return words.intersection(legal_terms)
        
        concepts1 = extract_legal_concepts(text1)
        concepts2 = extract_legal_concepts(text2)
        
        if not concepts1 or not concepts2:
            return 0.5  # Neutro se não há conceitos jurídicos
        
        intersection = concepts1.intersection(concepts2)
        union = concepts1.union(concepts2)
        
        return len(intersection) / len(union) if union else 0.0

    def _calculate_consensus_scores(
        self,
        similarity_matrix: List[List[float]],
        responses: List[LLMResponse],
        weights: Optional[Dict[str, float]]
    ) -> List[float]:
        """Calcula scores de consenso para cada resposta."""
        n = len(responses)
        scores = []
        
        for i in range(n):
            # Similaridade média com outras respostas
            similarities = [similarity_matrix[i][j] for j in range(n) if i != j]
            avg_similarity = mean(similarities) if similarities else 0.0
            
            # Peso do modelo (se especificado)
            model_weight = 1.0
            if weights and responses[i].model in weights:
                model_weight = weights[responses[i].model]
            
            # Score de qualidade baseado em comprimento e tempo
            quality_score = self._calculate_quality_score(responses[i])
            
            # Score final combinado
            consensus_score = (
                avg_similarity * 0.6 +
                quality_score * 0.3 +
                model_weight * 0.1
            )
            
            scores.append(consensus_score)
        
        return scores

    def _calculate_quality_score(self, response: LLMResponse) -> float:
        """Calcula score de qualidade de uma resposta."""
        score = 0.5  # Base
        
        # Penalizar respostas muito curtas ou muito longas
        length = len(response.text)
        if 100 <= length <= 2000:
            score += 0.2
        elif length < 50:
            score -= 0.2
        
        # Bonificar tempo de processamento razoável
        if 1.0 <= response.processing_time <= 30.0:
            score += 0.1
        
        # Penalizar se há indicação de erro
        if response.error:
            score -= 0.3
        
        # Bonificar se há metadados úteis
        if response.metadata:
            score += 0.1
        
        return max(0.0, min(1.0, score))

    def _select_best_response(
        self,
        responses: List[LLMResponse],
        consensus_scores: List[float]
    ) -> ModelResponse:
        """Seleciona a melhor resposta baseada nos scores."""
        best_idx = max(range(len(consensus_scores)), key=lambda i: consensus_scores[i])
        best_response = responses[best_idx]
        
        return ModelResponse(
            model_name=best_response.model,
            response_text=best_response.text,
            confidence=consensus_scores[best_idx],
            processing_time=best_response.processing_time,
            tokens_used=best_response.tokens_used or 0,
            cost=best_response.cost or 0.0
        )

    def _calculate_final_consensus(
        self,
        similarity_matrix: List[List[float]],
        consensus_scores: List[float],
        responses: List[LLMResponse]
    ) -> float:
        """Calcula score final de consenso."""
        if not consensus_scores:
            return 0.0
        
        # Score médio de consenso
        avg_consensus = mean(consensus_scores)
        
        # Similaridade média geral
        all_similarities = []
        n = len(similarity_matrix)
        for i in range(n):
            for j in range(i + 1, n):
                all_similarities.append(similarity_matrix[i][j])
        
        avg_similarity = mean(all_similarities) if all_similarities else 0.0
        
        # Penalizar se há muita variação entre scores
        score_variance = self._calculate_variance(consensus_scores)
        variance_penalty = min(score_variance, 0.2)
        
        # Score final
        final_score = (
            avg_consensus * 0.5 +
            avg_similarity * 0.4 +
            (1.0 - variance_penalty) * 0.1
        )
        
        return max(0.0, min(1.0, final_score))

    def _calculate_variance(self, scores: List[float]) -> float:
        """Calcula variância dos scores."""
        if len(scores) < 2:
            return 0.0
        
        avg = mean(scores)
        variance = sum((s - avg) ** 2 for s in scores) / len(scores)
        return variance

    async def _enrich_response(
        self,
        best_response: ModelResponse,
        all_responses: List[LLMResponse]
    ) -> str:
        """Enriquece a melhor resposta com informações adicionais."""
        base_text = best_response.response_text
        
        # Extrair informações únicas de outras respostas
        additional_info = []
        base_sentences = set(self._extract_sentences(base_text))
        
        for response in all_responses:
            if response.model == best_response.model_name:
                continue
            
            sentences = self._extract_sentences(response.text)
            for sentence in sentences:
                # Se a frase é suficientemente diferente e relevante
                if (len(sentence) > 20 and 
                    not any(self._sentence_similarity(sentence, base_sent) > 0.8 
                           for base_sent in base_sentences)):
                    additional_info.append(sentence)
        
        # Adicionar no máximo 2 informações adicionais mais relevantes
        if additional_info:
            selected_info = additional_info[:2]
            enriched = f"{base_text}\n\nInformação complementar:\n"
            for info in selected_info:
                enriched += f"• {info}\n"
            return enriched
        
        return base_text

    def _extract_sentences(self, text: str) -> List[str]:
        """Extrai frases de um texto."""
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 10]

    def _sentence_similarity(self, sent1: str, sent2: str) -> float:
        """Calcula similaridade entre duas frases."""
        return difflib.SequenceMatcher(None, sent1.lower(), sent2.lower()).ratio()

    def _llm_to_model_response(self, llm_response: LLMResponse) -> ModelResponse:
        """Converte LLMResponse para ModelResponse."""
        return ModelResponse(
            model_name=llm_response.model,
            response_text=llm_response.text,
            confidence=0.8,  # Confiança padrão para resposta única
            processing_time=llm_response.processing_time,
            tokens_used=llm_response.tokens_used or 0,
            cost=llm_response.cost or 0.0
        )

    def _is_repetitive(self, text: str) -> bool:
        """Verifica se o texto é muito repetitivo."""
        words = text.split()
        if len(words) < 10:
            return False
        
        # Contar palavras únicas vs total
        unique_words = len(set(words))
        repetition_ratio = unique_words / len(words)
        
        return repetition_ratio < 0.5

    def _has_basic_structure(self, text: str) -> bool:
        """Verifica se o texto tem estrutura básica."""
        # Deve ter pelo menos uma frase completa
        has_sentence = bool(re.search(r'[.!?]', text))
        
        # Deve ter palavras suficientes
        word_count = len(text.split())
        
        return has_sentence and word_count >= 5

    def _has_encoding_issues(self, text: str) -> bool:
        """Verifica problemas de encoding."""
        # Caracteres estranhos que indicam problemas de encoding
        problematic_chars = ['�', '\ufffd', '\x00']
        return any(char in text for char in problematic_chars)

    def _looks_like_error(self, text: str) -> bool:
        """Verifica se parece mensagem de erro."""
        error_indicators = [
            'erro', 'error', 'falha', 'failed', 'exception',
            'não foi possível', 'unable to', 'timeout',
            'conexão', 'connection', 'limite', 'limit'
        ]
        
        lower_text = text.lower()
        return any(indicator in lower_text for indicator in error_indicators)
