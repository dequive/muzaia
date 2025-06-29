# -*- coding: utf-8 -*-
"""Middleware de rate limiting."""
import time
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware simples de rate limiting."""
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, time.time()))
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()
        
        # Limpar entradas antigas
        if current_time - self.clients[client_ip][1] > self.period:
            self.clients[client_ip] = (0, current_time)
        
        # Verificar limite
        calls_made, window_start = self.clients[client_ip]
        
        if calls_made >= self.calls:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        # Incrementar contador
        self.clients[client_ip] = (calls_made + 1, window_start)
        
        return await call_next(request)
