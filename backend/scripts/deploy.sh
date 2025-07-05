#!/bin/bash
# backend/scripts/deploy.sh
# Script de deploy para o ambiente de produção.

set -euo pipefail # Fail on error, undefined variable, or pipe failure

# --- Configurações ---
COMPOSE_FILE="docker-compose.prod.yml"
CONTAINER_NAME="muzaia-backend" # Nome do container do serviço no docker-compose
BACKUP_DIR="backups"

# --- Cores ---
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Validações Iniciais ---
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    log_error "Docker e/ou docker-compose não estão instalados. Abortando."
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Arquivo de compose de produção '$COMPOSE_FILE' não encontrado."
    exit 1
fi

if [ ! -f ".env.production" ]; then
    log_error "Arquivo de configuração '.env.production' não encontrado. Abortando."
    exit 1
fi

# --- Início do Deploy ---
log_info "🚀 Iniciando deploy do Muzaia LLM Orchestrator..."

# 1. Parar serviços atuais para evitar conflitos
log_info "Parando serviços existentes..."
docker-compose -f "$COMPOSE_FILE" down

# 2. Construir as imagens mais recentes
log_info "Construindo novas imagens a partir do Dockerfile..."
docker-compose -f "$COMPOSE_FILE" build --no-cache backend

# 3. Executar migrações do banco de dados
log_info "Executando migrações do banco de dados..."
docker-compose -f "$COMPOSE_FILE" run --rm backend poetry run alembic upgrade head

# 4. Iniciar os serviços em modo detached
log_info "Iniciando serviços..."
docker-compose -f "$COMPOSE_FILE" up -d

# 5. Verificação de saúde do container (Health Check)
log_info "Aguardando o serviço ficar saudável..."
for i in {1..15}; do
    # Inspeciona o status do health check diretamente do Docker
    HEALTH_STATUS=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "starting")
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        log_success "✅ Serviço está saudável e operando!"
        docker-compose -f "$COMPOSE_FILE" logs --tail=20 backend
        exit 0
    fi
    
    log_info "Status atual: $HEALTH_STATUS. Aguardando... ($i/15)"
    sleep 5
done

log_error "❌ O serviço não ficou saudável a tempo. Verifique os logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=50 backend
exit 1
