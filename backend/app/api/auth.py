
"""
Endpoints de autenticação OAuth.
"""
from fastapi import APIRouter, HTTPException, Query, Request, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import structlog

from app.core.auth import auth_service, get_current_user, require_auth
from app.core.config import settings
from app.database.connection import get_db_session
from app.models.auth import User, OAuthState

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.get("/google/login")
async def google_login(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Inicia login com Google."""
    try:
        # Gerar estado único
        state = auth_service.generate_state()
        
        # Salvar estado na base de dados
        oauth_state = OAuthState(
            state=state,
            provider="google",
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.add(oauth_state)
        await db.commit()
        
        # Obter URL de autorização
        auth_url = await auth_service.get_google_auth_url(state)
        
        return JSONResponse({
            "success": True,
            "auth_url": auth_url,
            "state": state
        })
        
    except Exception as e:
        logger.error("Error starting Google login", error=str(e))
        raise HTTPException(status_code=500, detail="Erro ao iniciar login Google")

@router.get("/microsoft/login")
async def microsoft_login(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Inicia login com Microsoft."""
    try:
        # Gerar estado único
        state = auth_service.generate_state()
        
        # Salvar estado na base de dados
        oauth_state = OAuthState(
            state=state,
            provider="microsoft",
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.add(oauth_state)
        await db.commit()
        
        # Obter URL de autorização
        auth_url = await auth_service.get_microsoft_auth_url(state)
        
        return JSONResponse({
            "success": True,
            "auth_url": auth_url,
            "state": state
        })
        
    except Exception as e:
        logger.error("Error starting Microsoft login", error=str(e))
        raise HTTPException(status_code=500, detail="Erro ao iniciar login Microsoft")

@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db_session)
):
    """Callback do Google OAuth."""
    try:
        # Validar estado
        oauth_state = await db.query(OAuthState).filter(
            OAuthState.state == state,
            OAuthState.provider == "google",
            OAuthState.used == False,
            OAuthState.expires_at > datetime.utcnow()
        ).first()
        
        if not oauth_state:
            raise HTTPException(status_code=400, detail="Estado inválido ou expirado")
        
        # Marcar estado como usado
        oauth_state.used = True
        await db.commit()
        
        # Processar callback
        result = await auth_service.handle_google_callback(code, state)
        
        # Criar resposta com tokens
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
        response.set_cookie(
            key="access_token",
            value=result["tokens"]["access_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=900  # 15 minutos
        )
        response.set_cookie(
            key="refresh_token",
            value=result["tokens"]["refresh_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=604800  # 7 dias
        )
        
        return response
        
    except Exception as e:
        logger.error("Error in Google callback", error=str(e))
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=auth_error")

@router.get("/microsoft/callback")
async def microsoft_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db_session)
):
    """Callback da Microsoft OAuth."""
    try:
        # Validar estado
        oauth_state = await db.query(OAuthState).filter(
            OAuthState.state == state,
            OAuthState.provider == "microsoft",
            OAuthState.used == False,
            OAuthState.expires_at > datetime.utcnow()
        ).first()
        
        if not oauth_state:
            raise HTTPException(status_code=400, detail="Estado inválido ou expirado")
        
        # Marcar estado como usado
        oauth_state.used = True
        await db.commit()
        
        # Processar callback
        result = await auth_service.handle_microsoft_callback(code, state)
        
        # Criar resposta com tokens
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
        response.set_cookie(
            key="access_token",
            value=result["tokens"]["access_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=900  # 15 minutos
        )
        response.set_cookie(
            key="refresh_token",
            value=result["tokens"]["refresh_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=604800  # 7 dias
        )
        
        return response
        
    except Exception as e:
        logger.error("Error in Microsoft callback", error=str(e))
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=auth_error")

@router.get("/me")
async def get_current_user_profile(
    user: User = Depends(get_current_user)
):
    """Obtém perfil do utilizador actual."""
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    return JSONResponse({
        "success": True,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "provider": user.provider,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None
        }
    })

@router.post("/logout")
async def logout(
    request: Request,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db_session)
):
    """Logout do utilizador."""
    try:
        # Invalidar todas as sessões do utilizador
        await db.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.is_active == True
        ).update({"is_active": False})
        await db.commit()
        
        # Criar resposta e remover cookies
        response = JSONResponse({
            "success": True,
            "message": "Logout realizado com sucesso"
        })
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        
        return response
        
    except Exception as e:
        logger.error("Error during logout", user_id=str(user.id), error=str(e))
        raise HTTPException(status_code=500, detail="Erro no logout")

@router.post("/refresh")
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Refresh do token de acesso."""
    try:
        # Obter refresh token do cookie
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token não encontrado")
        
        # Validar refresh token
        payload = jwt.decode(
            refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_id = payload.get("sub")
        user = await db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Utilizador inválido")
        
        # Gerar novos tokens
        new_tokens = await auth_service.generate_user_tokens(user)
        
        # Criar resposta com novos tokens
        response = JSONResponse({
            "success": True,
            "tokens": new_tokens
        })
        response.set_cookie(
            key="access_token",
            value=new_tokens["access_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=900
        )
        response.set_cookie(
            key="refresh_token",
            value=new_tokens["refresh_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=604800
        )
        
        return response
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expirado")
    except Exception as e:
        logger.error("Error refreshing token", error=str(e))
        raise HTTPException(status_code=500, detail="Erro ao renovar token")
