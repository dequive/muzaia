# backend/app/core/protocols.py

from typing import Protocol
from app.schemas import LLMResponse

class AbstractLLM(Protocol):
    """
    Protocolo que define a interface esperada para todas as implementações de LLMs.
    Isto garante que o orquestrador pode tratar qualquer modelo de forma polimórfica.
    """
    model_name: str

    async def generate(self, prompt: str, context: str) -> LLMResponse:
        """
        Gera uma resposta a partir do modelo.
        
        Args:
            prompt: O texto de entrada do utilizador.
            context: O contexto da consulta (ex: 'legal_research').

        Returns:
            Uma instância de LLMResponse com a resposta normalizada.
        """
        ...

    async def close(self):
        """Liberta recursos, como sessões de rede, se aplicável."""
        # A implementação é opcional; por isso, 'pass' é um default aceitável.
        pass
