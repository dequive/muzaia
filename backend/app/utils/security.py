# -*- coding: utf-8 -*-
"""
Utilitários de segurança.

Funções para geração de chaves, hashing seguro,
sanitização de entrada e outras operações de segurança.
"""
import hashlib
import secrets
import uuid
import re
from typing import Optional, Union
import bcrypt
import jwt
from datetime import datetime, timedelta

def generate_api_key(length: int = 32) -> str:
    """
    Gera chave de API segura.

    Args:
        length: Comprimento da chave

    Returns:
        Chave de API base64url-safe
    """
    return secrets.token_urlsafe(length)

def hash_string(text: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash seguro de string com salt.

    Args:
        text: Texto a ser hasheado
        salt: Salt opcional (será gerado se não fornecido)

    Returns:
        Tuple com (hash_hex, salt_hex)
    """
    if not salt:
        salt = secrets.token_hex(16)

    # Usar PBKDF2 com SHA-256
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256', 
        text.encode('utf-8'), 
        salt.encode('utf-8'), 
        100000  # 100k iterações
    )

    return hash_bytes.hex(), salt

def verify_hash(text: str, hash_hex: str, salt: str) -> bool:
    """
    Verifica se texto corresponde ao hash.

    Args:
        text: Texto a verificar
        hash_hex: Hash em hexadecimal
        salt: Salt usado no hash

    Returns:
        True se texto corresponder ao hash
    """
    computed_hash, _ = hash_string(text, salt)
    return secrets.compare_digest(computed_hash, hash_hex)

def generate_uuid() -> str:
    """
    Gera UUID v4 seguro.

    Returns:
        UUID como string
    """
    return str(uuid.uuid4())

def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitiza entrada do usuário.

    Args:
        text: Texto a sanitizar
        max_length: Comprimento máximo

    Returns:
        Texto sanitizado
    """
    if not text:
        return ""

    # Truncar se muito longo
    text = text[:max_length]

    # Remover caracteres perigosos
    text = re.sub(r'[<>"\'\&]', '', text)

    # Normalizar espaços
    text = re.sub(r'\s+', ' ', text).strip()

    return text

def is_valid_email(email: str) -> bool:
    """
    Valida formato de email.

    Args:
        email: Email a validar

    Returns:
        True se email for válido
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def generate_session_token() -> str:
    """
    Gera token de sessão seguro.

    Returns:
        Token de sessão
    """
    return secrets.token_urlsafe(32)

def constant_time_compare(a: Union[str, bytes], b: Union[str, bytes]) -> bool:
    """
    Comparação de strings/bytes em tempo constante.

    Args:
        a: Primeira string/bytes
        b: Segunda string/bytes

    Returns:
        True se forem iguais
    """
    if isinstance(a, str):
        a = a.encode('utf-8')
    if isinstance(b, str):
        b = b.encode('utf-8')

    return secrets.compare_digest(a, b)

def hash_password(password: str) -> str:
    """Gera hash da senha."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Cria token JWT de acesso."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=8)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, "your-secret-key", algorithm="HS256")
    return encoded_jwt