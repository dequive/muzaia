#!/bin/bash
# backend/scripts/start.sh
# Script de inicialização para desenvolvimento local.

set -e

# --- Cores para o output ---
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

log_info "🚀 Iniciando Muzaia Backend em modo de desenvolvimento..."

# 1. Valida se o Poetry está instalado
if ! command -v poetry &> /dev/null; then
    log_error "Poetry não foi encontrado. Por favor, instale-o para continuar."
    log_info "Instruções: https://python-poetry.org/docs/#installation"
    exit 1
fi

# 2. Garante que as dependências estão instaladas
# O Poetry cria um arquivo poetry.lock, que é a fonte da verdade.
if [ ! -f "poetry.lock" ]; then
    log_error "Arquivo poetry.lock não encontrado. Execute 'poetry lock' para criar."
    exit 1
fi
log_info "Verificando e instalando dependências com 'poetry install'..."
poetry install --no-interaction --no-ansi

# 3. Configura o arquivo de ambiente .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log_warn "Arquivo .env não encontrado. Copiando de .env.example..."
        cp .env.example .env
        log_success ".env criado. Lembre-se de revisar as variáveis de ambiente."
    else
        log_warn "Nenhum .env ou .env.example encontrado. A aplicação pode não funcionar corretamente."
    fi
fi

# 4. Executa migrações do Alembic se o argumento --migrate for passado
if [[ "$*" == *--migrate* ]]; then
    log_info "Executando migrações do banco de dados com Alembic..."
    poetry run alembic upgrade head
    log_success "Migrações do banco de dados concluídas."
fi

# 5. Inicia o servidor Uvicorn com hot-reload
log_info "Iniciando servidor em http://localhost:8000"
log_info "Use CTRL+C para parar."
poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
