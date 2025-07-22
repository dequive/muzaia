
"""
Sistema de autenticação OAuth2 federado com Google e Microsoft.
"""
from jose import jwt
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog
from urllib.parse import urlencode
import secrets

from app.core.config import settings
from app.database.connection import get_db_session
from app.models.auth import User, UserSession
from app.utils.security import create_access_token, verify_password, hash_password

logger = structlog.get_logger(__name__)

class OAuthProvider:
    """Base class para provedores OAuth."""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    async def get_authorization_url(self, state: str) -> str:
        """Gera URL de autorização."""
        raise NotImplementedError
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Troca código por token de acesso."""
        raise NotImplementedError
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Obtém informações do utilizador."""
        raise NotImplementedError


class GoogleOAuthProvider(OAuthProvider):
    """Provedor OAuth para Google."""
    
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    async def get_authorization_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile",
            "response_type": "code",
            "state": state,
            "access_type": "offline",
            "prompt": "consent"
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()


class MicrosoftOAuthProvider(OAuthProvider):
    """Provedor OAuth para Microsoft."""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str, tenant_id: str = "common"):
        super().__init__(client_id, client_secret, redirect_uri)
        self.tenant_id = tenant_id
        self.auth_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"
        self.token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    
    USER_INFO_URL = "https://graph.microsoft.com/v1.0/me"
    
    async def get_authorization_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile User.Read",
            "response_type": "code",
            "state": state,
            "prompt": "consent"
        }
        return f"{self.auth_url}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            data = response.json()
            # Normalizar para formato padrão
            return {
                "email": data.get("mail") or data.get("userPrincipalName"),
                "name": data.get("displayName"),
                "picture": data.get("photo", {}).get("@odata.mediaContentType") if "photo" in data else None,
                "id": data.get("id")
            }


class AuthenticationService:
    """Serviço de autenticação principal."""
    
    def __init__(self):
        self.google_provider = GoogleOAuthProvider(
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            redirect_uri=f"{settings.BASE_URL}/api/auth/google/callback"
        )
        
        self.microsoft_provider = MicrosoftOAuthProvider(
            client_id=settings.MICROSOFT_CLIENT_ID,
            client_secret=settings.MICROSOFT_CLIENT_SECRET,
            redirect_uri=f"{settings.BASE_URL}/api/auth/microsoft/callback",
            tenant_id=settings.MICROSOFT_TENANT_ID
        )
    
    def generate_state(self) -> str:
        """Gera estado aleatório para OAuth."""
        return secrets.token_urlsafe(32)
    
    async def get_google_auth_url(self, state: str) -> str:
        """Obtém URL de autorização do Google."""
        return await self.google_provider.get_authorization_url(state)
    
    async def get_microsoft_auth_url(self, state: str) -> str:
        """Obtém URL de autorização da Microsoft."""
        return await self.microsoft_provider.get_authorization_url(state)
    
    async def handle_google_callback(self, code: str, state: str) -> Dict[str, Any]:
        """Processa callback do Google."""
        try:
            # Trocar código por token
            token_data = await self.google_provider.exchange_code_for_token(code)
            access_token = token_data["access_token"]
            
            # Obter informações do utilizador
            user_info = await self.google_provider.get_user_info(access_token)
            
            # Criar ou actualizar utilizador
            user = await self.create_or_update_user(
                email=user_info["email"],
                name=user_info.get("name"),
                avatar_url=user_info.get("picture"),
                provider="google",
                provider_id=user_info["id"]
            )
            
            # Gerar tokens JWT
            tokens = await self.generate_user_tokens(user)
            
            return {
                "user": user,
                "tokens": tokens
            }
            
        except Exception as e:
            logger.error("Error in Google callback", error=str(e))
            raise HTTPException(status_code=400, detail="Erro na autenticação Google")
    
    async def handle_microsoft_callback(self, code: str, state: str) -> Dict[str, Any]:
        """Processa callback da Microsoft."""
        try:
            # Trocar código por token
            token_data = await self.microsoft_provider.exchange_code_for_token(code)
            access_token = token_data["access_token"]
            
            # Obter informações do utilizador
            user_info = await self.microsoft_provider.get_user_info(access_token)
            
            # Criar ou actualizar utilizador
            user = await self.create_or_update_user(
                email=user_info["email"],
                name=user_info.get("name"),
                avatar_url=user_info.get("picture"),
                provider="microsoft",
                provider_id=user_info["id"]
            )
            
            # Gerar tokens JWT
            tokens = await self.generate_user_tokens(user)
            
            return {
                "user": user,
                "tokens": tokens
            }
            
        except Exception as e:
            logger.error("Error in Microsoft callback", error=str(e))
            raise HTTPException(status_code=400, detail="Erro na autenticação Microsoft")
    
    async def create_or_update_user(
        self,
        email: str,
        name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        provider: str = "email",
        provider_id: Optional[str] = None
    ) -> User:
        """Cria ou actualiza utilizador."""
        async with get_db_session() as db:
            # Verificar se utilizador já existe
            existing_user = await db.query(User).filter(User.email == email).first()
            
            if existing_user:
                # Actualizar informações se necessário
                if name and not existing_user.name:
                    existing_user.name = name
                if avatar_url and not existing_user.avatar_url:
                    existing_user.avatar_url = avatar_url
                if provider_id and not existing_user.provider_id:
                    existing_user.provider_id = provider_id
                
                existing_user.last_login_at = datetime.utcnow()
                await db.commit()
                return existing_user
            
            # Criar novo utilizador
            new_user = User(
                email=email,
                name=name or email.split("@")[0],
                avatar_url=avatar_url,
                provider=provider,
                provider_id=provider_id,
                is_active=True,
                role="user",
                created_at=datetime.utcnow(),
                last_login_at=datetime.utcnow()
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            logger.info("New user created", user_id=str(new_user.id), email=email, provider=provider)
            return new_user
    
    async def generate_user_tokens(self, user: User) -> Dict[str, str]:
        """Gera tokens JWT para utilizador."""
        # Access token (15 minutos)
        access_payload = {
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=15)
        }
        access_token = create_access_token(access_payload)
        
        # Refresh token (7 dias)
        refresh_payload = {
            "sub": str(user.id),
            "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        refresh_token = create_access_token(refresh_payload)
        
        # Salvar sessão
        await self.create_user_session(user.id, access_token, refresh_token)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 900  # 15 minutos
        }
    
    async def create_user_session(self, user_id: str, access_token: str, refresh_token: str):
        """Cria sessão de utilizador."""
        async with get_db_session() as db:
            session = UserSession(
                user_id=user_id,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=datetime.utcnow() + timedelta(minutes=15),
                refresh_expires_at=datetime.utcnow() + timedelta(days=7),
                is_active=True
            )
            
            db.add(session)
            await db.commit()
    
    async def verify_token(self, token: str) -> Optional[User]:
        """Verifica token JWT e retorna utilizador."""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            if payload.get("type") != "access":
                return None
            
            user_id = payload.get("sub")
            if not user_id:
                return None
            
            async with get_db_session() as db:
                user = await db.query(User).filter(User.id == user_id).first()
                return user if user and user.is_active else None
                
        except jwt.ExpiredSignatureError:
            return None
        except Exception:
            return None


# Instância global do serviço
auth_service = AuthenticationService()

# Bearer token security
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = security) -> Optional[User]:
    """Dependency para obter utilizador actual."""
    if not credentials:
        return None
    
    return await auth_service.verify_token(credentials.credentials)

async def require_auth(user: User = Depends(get_current_user)) -> User:
    """Dependency que requer autenticação."""
    if not user:
        raise HTTPException(status_code=401, detail="Autenticação requerida")
    return user

async def require_admin(user: User = Depends(require_auth)) -> User:
    """Dependency que requer permissões de admin."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permissões de administrador requeridas")
    return user
