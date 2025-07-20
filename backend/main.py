from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Mozaia Backend...")
    yield
    print("🛑 Shutting down Mozaia Backend...")

app = FastAPI(
    title="Mozaia Backend",
    description="Sistema Avançado de Consenso entre LLMs",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, be more specific
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Mozaia Backend is running!", "status": "healthy"}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

@app.get("/api/v1/conversations")
async def get_conversations():
    # Mock data for now
    return {
        "conversations": [
            {
                "id": "1",
                "title": "Conversa de exemplo",
                "context": "general",
                "message_count": 5,
                "avg_confidence": 0.85,
                "created_at": "2024-01-15T10:00:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        ]
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENV") == "development" else False,
        log_level="info"
    )