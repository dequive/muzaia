# -*- coding: utf-8 -*-
"""Módulo de modelos LLM."""

from .local_llm import OllamaLLM
from .api_llm import OpenRouterLLM, CohereLLM

__all__ = ["OllamaLLM", "OpenRouterLLM", "CohereLLM"]
