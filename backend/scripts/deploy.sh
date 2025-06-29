#!/bin/bash
# backend/scripts/deploy.sh
# Script de deploy para produção

set -e

echo "🚀 Iniciando deploy do Mozaia LLM Orchestrator..."

# Configurações
PROJECT_NAME="mozaia-llm-orchestrator"
DOCKER_IMAGE="$PROJECT_NAME:latest"
CONTAINER_NAME="$PROJECT_NAME-backend"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar se Docker está disponível
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado ou não está no PATH"
    exit 1
fi

# Verificar se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose não está instalado ou não está no PATH"
    exit 1
fi

# Verificar se arquivo de environment de produção existe
if [ ! -f ".env.production" ]; then
    log_error "Arquivo .env.production não encontrado"
    log_info "Crie o arquivo .env.production com as configurações de produção"
    exit 1
fi

# Fazer backup do banco de dados atual (se existir)
log_info "Fazendo backup do banco de dados..."
if docker ps | grep -q postgres; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker exec $(docker ps -qf "name=postgres") pg_dump -U mozaia_user mozaia_db > "backups/$BACKUP_FILE" || true
    log_success "Backup salvo em backups/$BACKUP_FILE"
fi

# Parar containers existentes
log_info "Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down || true

# Fazer pull das imagens mais recentes
log_info "Atualizando imagens Docker..."
docker-compose -f docker-compose.prod.yml pull

# Construir nova imagem
log_info "Construindo nova imagem..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

# Executar migrações do banco
log_info "Executando migrações do banco..."
docker-compose -f docker-compose.prod.yml run --rm backend python scripts/setup_db.py

# Iniciar serviços
log_info "Iniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar serviços ficarem prontos
log_info "Aguardando serviços ficarem prontos..."
sleep 30

# Verificar health check
log_info "Verificando health check..."
for i in {1..10}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "✅ Aplicação está rodando e saudável"
        break
    fi
    
    if [ $i -eq 10 ]; then
        log_error "❌ Aplicação não passou no health check"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    
    log_info "Tentativa $i/10 - aguardando..."
    sleep 10
done

# Limpeza de imagens antigas
log_info "Limpando imagens Docker antigas..."
docker image prune -f

log_success "🎉 Deploy concluído com sucesso!"
log_info "API disponível em: http://localhost:8000"
log_info "Documentação em: http://localhost:8000/docs"
