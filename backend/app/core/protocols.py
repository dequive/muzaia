# -*- coding: utf-8 -*-
"""
Protocolos e interfaces abstratas para o sistema Mozaia.

Define contratos claros para todos os componentes do sistema,
garantindo consistência e permitindo extensibilidade.
"""
from __future__ import annotations

import abc
from typing import Dict, Any, Optional, List, AsyncGenerator, TypedDict
from contextlib import asynccontextmanager

from app.schemas import LLMResponse, GenerationParams


class LLMStreamChunk(TypedDict, total=False):
    """Estrutura de dados para chunks de streaming."""
    content: str
    is_final: bool
    model: Optional[str]
    metadata: Optional[Dict[str, Any]]
    error: Optional[str]
    token_count: Optional[int]
    processing_time: Optional[float]


class AbstractLLM(abc.ABC):
    """
    Interface abstrata para todos os clientes LLM.
    
    Define o contrato que todos os modelos LLM devem implementar,
    garantindo uniformidade na interação independente do provedor.
    """
    
    @abc.abstractmethod
    async def generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> LLMResponse:
        """
        Gera resposta usando o modelo LLM.
        
        Args:
            prompt: Prompt principal para o modelo
            context: Contexto adicional da conversa
            system_prompt: Prompt do sistema (opcional)
            params: Parâmetros de geração (temperatura, tokens, etc.)
            
        Returns:
            LLMResponse com a resposta gerada e metadados
            
        Raises:
            LLMError: Se houver erro na geração
        """
        pass
    
    @abc.abstractmethod
    async def stream_generate(
        self,
        prompt: str,
        context: str = "",
        system_prompt: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        """
        Gera resposta em streaming.
        
        Args:
            prompt: Prompt principal para o modelo
            context: Contexto adicional da conversa
            system_prompt: Prompt do sistema (opcional)
            params: Parâmetros de geração
            
        Yields:
            LLMStreamChunk contendo chunks da resposta com metadados
        """
        pass
    
    @abc.abstractmethod
    async def health_check(self) -> bool:
        """
        Verifica se o modelo está saudável e responsivo.
        
        Returns:
            True se o modelo estiver funcionando corretamente
        """
        pass
    
    @abc.abstractmethod
    async def get_model_info(self) -> Dict[str, Any]:
        """
        Obtém informações sobre o modelo.
        
        Returns:
            Dict com informações do modelo (versão, capacidades, etc.)
        """
        pass
    
    @abc.abstractmethod
    async def close(self) -> None:
        """
        Fecha recursos associados ao modelo.
        
        Deve limpar conexões, caches e outros recursos.
        """
        pass
    
    @property
    @abc.abstractmethod
    def model_name(self) -> str:
        """Nome do modelo."""
        pass
    
    @property
    @abc.abstractmethod
    def provider(self) -> str:
        """Nome do provedor (ollama, openrouter, etc.)."""
        pass


class AbstractLLMFactory(abc.ABC):
    """
    Interface abstrata para fábricas de LLM.
    
    Define como criar e gerenciar diferentes tipos de modelos LLM,
    abstraindo as especificidades de cada provedor.
    """
    
    @abc.abstractmethod
    async def create_llm(
        self, 
        model_name: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> AbstractLLM:
        """
        Cria instância de LLM para um modelo específico.
        
        Args:
            model_name: Nome do modelo a ser criado
            config: Configurações específicas do modelo
            
        Returns:
            Instância configurada do LLM
            
        Raises:
            LLMError: Se não conseguir criar o modelo
        """
        pass
    
    @abc.abstractmethod
    def get_available_models(self) -> List[str]:
        """
        Retorna lista de modelos disponíveis.
        
        Returns:
            Lista de nomes de modelos que podem ser criados
        """
        pass
    
    @abc.abstractmethod
    async def validate_model(self, model_name: str) -> bool:
        """
        Valida se um modelo pode ser criado.
        
        Args:
            model_name: Nome do modelo a validar
            
        Returns:
            True se o modelo for válido e disponível
        """
        pass
    
    @abc.abstractmethod
    def get_provider_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Retorna informações sobre provedores registrados.
        
        Returns:
            Dict mapeando provedor para suas informações
        """
        pass
    
    @abc.abstractmethod
    def get_metrics(self) -> Dict[str, Any]:
        """
        Obtém métricas da factory.
        
        Returns:
            Dict com métricas de criação e uso
        """
        pass


class AbstractLLMPool(abc.ABC):
    """
    Interface abstrata para pools de LLM.
    
    Define como gerenciar um pool de instâncias LLM,
    incluindo aquisição, liberação e monitoramento.
    """
    
    @abc.abstractmethod
    @asynccontextmanager
    async def acquire(self, model_name: str) -> AsyncGenerator[AbstractLLM, None]:
        """
        Adquire instância LLM do pool de forma segura.
        
        Args:
            model_name: Nome do modelo a ser adquirido
            
        Yields:
            Instância LLM pronta para uso
            
        Raises:
            LLMError: Se não conseguir adquirir instância
        """
        pass
    
    @abc.abstractmethod
    async def preload_model(self, model_name: str, count: int = 1) -> int:
        """
        Pré-carrega instâncias de um modelo.
        
        Args:
            model_name: Nome do modelo
            count: Número de instâncias a criar
            
        Returns:
            Número de instâncias criadas com sucesso
        """
        pass
    
    @abc.abstractmethod
    async def close_all(self) -> None:
        """
        Fecha todas as instâncias do pool.
        
        Deve aguardar que todas as instâncias em uso sejam liberadas
        antes de fechar definitivamente.
        """
        pass
    
    @abc.abstractmethod
    async def validate_model(self, model_name: str) -> bool:
        """
        Valida se um modelo pode ser usado pelo pool.
        
        Args:
            model_name: Nome do modelo
            
        Returns:
            True se o modelo for válido
        """
        pass
    
    @abc.abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas detalhadas do pool.
        
        Returns:
            Dict com estatísticas por modelo e globais
        """
        pass
    
    @abc.abstractmethod
    def get_global_metrics(self) -> Dict[str, Any]:
        """
        Retorna métricas globais do pool.
        
        Returns:
            Dict com métricas de performance e uso
        """
        pass
    
    @property
    @abc.abstractmethod
    def size(self) -> int:
        """Número total de instâncias no pool."""
        pass
    
    @property
    @abc.abstractmethod
    def available(self) -> int:
        """Número de instâncias disponíveis."""
        pass


class AbstractConsensusEngine(abc.ABC):
    """
    Interface abstrata para motores de consenso.
    
    Define como calcular consenso entre múltiplas respostas LLM
    e determinar a qualidade e confiabilidade das respostas.
    """
    
    @abc.abstractmethod
    async def calculate_consensus(
        self,
        responses: List[LLMResponse],
        weights: Optional[Dict[str, float]] = None
    ) -> tuple[float, Any]:
        """
        Calcula consenso entre múltiplas respostas.
        
        Args:
            responses: Lista de respostas dos modelos
            weights: Pesos opcionais por modelo
            
        Returns:
            Tuple com (score_consenso, melhor_resposta)
        """
        pass
    
    @abc.abstractmethod
    async def merge_responses(
        self,
        responses: List[LLMResponse],
        consensus_score: float,
        best_response: Any
    ) -> str:
        """
        Mescla respostas baseado no consenso.
        
        Args:
            responses: Lista de respostas originais
            consensus_score: Score de consenso calculado
            best_response: Melhor resposta identificada
            
        Returns:
            Texto final mesclado
        """
        pass
    
    @abc.abstractmethod
    async def detect_outliers(self, responses: List[LLMResponse]) -> List[str]:
        """
        Detecta respostas outliers.
        
        Args:
            responses: Lista de respostas para analisar
            
        Returns:
            Lista de modelos identificados como outliers
        """
        pass
    
    @abc.abstractmethod
    async def validate_response_quality(
        self,
        response: str,
        min_length: int = 50
    ) -> tuple[bool, List[str]]:
        """
        Valida qualidade de uma resposta.
        
        Args:
            response: Texto da resposta
            min_length: Comprimento mínimo esperado
            
        Returns:
            Tuple com (é_válida, lista_problemas)
        """
        pass


class AbstractOrchestrator(abc.ABC):
    """
    Interface abstrata para orquestradores de LLM.
    
    Define como coordenar múltiplos modelos para gerar
    respostas consensuais de alta qualidade.
    """
    
    @abc.abstractmethod
    async def generate(
        self,
        query: str,
        context: str = "general",
        user_id: Optional[str] = None,
        params: Optional[GenerationParams] = None,
        min_confidence: Optional[float] = None
    ) -> Any:
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
        """
        pass
    
    @abc.abstractmethod
    async def stream_generate(
        self,
        query: str,
        context: str = "general",
        user_id: Optional[str] = None,
        params: Optional[GenerationParams] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Gera resposta em streaming.
        
        Args:
            query: Consulta do usuário
            context: Contexto da consulta
            user_id: Identificador do usuário
            params: Parâmetros de geração
            
        Yields:
            Chunks da resposta em streaming
        """
        pass
    
    @abc.abstractmethod
    async def get_available_models(self) -> List[str]:
        """
        Obtém lista de modelos disponíveis.
        
        Returns:
            Lista de nomes dos modelos disponíveis
        """
        pass
    
    @abc.abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Verifica saúde do orquestrador.
        
        Returns:
            Status de saúde detalhado
        """
        pass
    
    @abc.abstractmethod
    def get_metrics(self) -> Dict[str, Any]:
        """
        Obtém métricas do orquestrador.
        
        Returns:
            Métricas detalhadas de uso e performance
        """
        pass
    
    @abc.abstractmethod
    async def initialize(self) -> None:
        """Inicializa o orquestrador."""
        pass
    
    @abc.abstractmethod
    async def clear_cache(self) -> None:
        """Limpa cache de respostas."""
        pass


# Exceções do protocolo
class LLMError(Exception):
    """Exceção base para erros de LLM."""
    
    def __init__(self, message: str, model_name: Optional[str] = None):
        self.message = message
        self.model_name = model_name
        super().__init__(self.message)


class LLMConnectionError(LLMError):
    """Erro de conexão com LLM."""
    pass


class LLMTimeoutError(LLMError):
    """Timeout na comunicação com LLM."""
    pass


class LLMRateLimitError(LLMError):
    """Rate limit excedido."""
    pass


class LLMInvalidResponseError(LLMError):
    """Resposta inválida do LLM."""
    pass


# Type hints úteis
LLMInstance = AbstractLLM
LLMFactoryInstance = AbstractLLMFactory
LLMPoolInstance = AbstractLLMPool
ConsensusEngineInstance = AbstractConsensusEngine
OrchestratorInstance = AbstractOrchestrator
