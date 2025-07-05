#!/bin/bash
set -euo pipefail
COMPOSE_FILE="docker-compose.prod.yml"
CONTAINER_NAME="muzaia-backend"
BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

log_info "🚀 Iniciando deploy..."

docker-compose -f "$COMPOSE_FILE" down
docker-compose -f "$COMPOSE_FILE" build --no-cache backend
docker-compose -f "$COMPOSE_FILE" run --rm backend poetry run alembic upgrade head
docker-compose -f "$COMPOSE_FILE" up -d

log_info "Aguardando o serviço ficar saudável..."
for i in {1..15}; do
    HEALTH_STATUS=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "starting")
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        log_success "✅ Serviço está saudável!"
        exit 0
    fi
    log_info "Status: $HEALTH_STATUS. Aguardando... ($i/15)"
    sleep 5
done

log_error "❌ O serviço não ficou saudável. Verifique os logs."
docker-compose -f "$COMPOSE_FILE" logs --tail=50 backend
exit 1
