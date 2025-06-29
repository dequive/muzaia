# -*- coding: utf-8 -*-
"""
Aplicação Muzaia LLM Orchestrator.

Sistema enterprise para orquestração de múltiplos modelos LLM
com consenso, resiliência e observabilidade completa.
"""

__version__ = "2.0.0"
__title__ = "Muzaia LLM Orchestrator"
__description__ = "Orquestrador enterprise para múltiplos LLMs com gestão avançada de recursos"
__author__ = "Wezo"
__email__ = "dev@muzaia.mz"
__license__ = "MIT"
__url__ = "https://github.com/dequive/muzaia"

# Metadados para compatibilidade
APP_NAME = __title__
APP_VERSION = __version__
APP_DESCRIPTION = __description__

# Configurações de logging padrão
import logging

# Configurar logger padrão para a aplicação
logging.getLogger(__name__).addHandler(logging.NullHandler())
