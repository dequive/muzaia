# -*- coding: utf-8 -*-
"""Utilitários de segurança."""
import hashlib
import secrets
from typing import Optional

def generate_api_key(length: int = 32) -> str:
    """Gera chave de API segura."""
    return secrets.token_urlsafe(length)

def hash_string(text: str, salt: Optional[str] = None) -> str:
    """Hash seguro de string."""
    if not salt:
        salt = secrets.token_hex(16)
    
    return hashlib.pbkdf2_hmac('sha256', text.encode(), salt.encode(), 100000).hex()
