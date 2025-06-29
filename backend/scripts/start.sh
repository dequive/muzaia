#!/bin/bash
# backend/scripts/start.sh
# Script de inicialização do backend Mozaia

set -e  # Exit on any error

echo "🚀 Iniciando Mozaia LLM Orchestrator Backend..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "main.py" ]; then
    log_error "main.py não encontrado. Execute este script do diretório backend/"
    exit 1
fi

# Carregar variáveis de ambiente
if [ -f ".env" ]; then
    log_info "Carregando variáveis de ambiente de .env"
    set -a
    source .env
    set +a
else
    log_warning "Arquivo .env não encontrado. Usando .env.example como base"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "Arquivo .env criado a partir de .env.example"
        log_warning "⚠️  IMPORTANTE: Configure as variáveis em .env antes de continuar"
    fi
fi

# Verificar dependências do Python
log_info "Verificando dependências do Python..."
if [ ! -d "venv" ] && [ ! -n "$VIRTUAL_ENV" ]; then
    log_warning "Ambiente virtual não detectado. Criando venv..."
    python3 -m venv venv
    source venv/bin/activate
    log_success "Ambiente virtual criado e ativado"
fi

# Ativar ambiente virtual se existe
if [ -d "venv" ] && [ ! -n "$VIRTUAL_ENV" ]; then
    log_info "Ativando ambiente virtual..."
    source venv/bin/activate
fi

# Instalar/atualizar dependências
log_info "Instalando dependências..."
pip install --upgrade pip
pip install -r requirements.txt

# Verificar se Ollama está rodando (opcional)
log_info "Verificando se Ollama está disponível..."
if command -v curl &> /dev/null; then
    if curl -s "${OLLAMA_BASE_URL:-http://localhost:11434}/api/tags" > /dev/null 2>&1; then
        log_success "✅ Ollama está rodando"
    else
        log_warning "⚠️  Ollama não está rodando ou não está acessível"
        log_info "Para instalar Ollama: curl -fsSL https://ollama.ai/install.sh | sh"
    fi
else
    log_warning "curl não encontrado, pulando verificação do Ollama"
fi

# Verificar conectividade com PostgreSQL
log_info "Verificando conectividade com PostgreSQL..."
if command -v pg_isready &> /dev/null; then
    if pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" > /dev/null 2>&1; then
        log_success "✅ PostgreSQL está acessível"
    else
        log_error "❌ PostgreSQL não está acessível"
        log_info "Verifique se PostgreSQL está rodando e as configurações em .env"
        exit 1
    fi
else
    log_warning "pg_isready não encontrado, pulando verificação do PostgreSQL"
fi

# Verificar conectividade com Redis
log_info "Verificando conectividade com Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli -u "${REDIS_URL:-redis://localhost:6379}" ping > /dev/null 2>&1; then
        log_success "✅ Redis está acessível"
    else
        log_warning "⚠️  Redis não está acessível"
        log_info "Redis é opcional, mas recomendado para cache"
    fi
else
    log_warning "redis-cli não encontrado, pulando verificação do Redis"
fi

# Setup do banco de dados
log_info "Configurando banco de dados..."
if python scripts/setup_db.py --verify-only > /dev/null 2>&1; then
    log_success "✅ Banco de dados já está configurado"
else
    log_info "Executando setup do banco de dados..."
    python scripts/setup_db.py
    if [ $? -eq 0 ]; then
        log_success "✅ Banco de dados configurado com sucesso"
    else
        log_error "❌ Falha no setup do banco de dados"
        exit 1
    fi
fi

# Executar migrações do Alembic (se disponível)
if [ -f "alembic.ini" ]; then
    log_info "Executando migrações do banco de dados..."
    alembic upgrade head
    if [ $? -eq 0 ]; then
        log_success "✅ Migrações executadas com sucesso"
    else
        log_error "❌ Falha nas migrações"
        exit 1
    fi
fi

# Baixar modelos Ollama necessários (se Ollama estiver disponível)
if curl -s "${OLLAMA_BASE_URL:-http://localhost:11434}/api/tags" > /dev/null 2>&1; then
    log_info "Verificando modelos Ollama necessários..."
    
    REQUIRED_MODELS=("${OLLAMA_LLAMA_MODEL:-llama3:8b}" "${OLLAMA_GEMMA_MODEL:-gemma2:9b}")
    
    for model in "${REQUIRED_MODELS[@]}"; do
        if ! curl -s "${OLLAMA_BASE_URL:-http://localhost:11434}/api/tags" | grep -q "\"name\":\"$model\""; then
            log_info "Baixando modelo $model..."
            curl -X POST "${OLLAMA_BASE_URL:-http://localhost:11434}/api/pull" \
                -H "Content-Type: application/json" \
                -d "{\"name\":\"$model\"}" &
        else
            log_success "✅ Modelo $model já está disponível"
        fi
    done
    
    # Aguardar downloads terminarem
    wait
fi

# Definir configurações de execução
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}
WORKERS=${WORKERS:-1}
RELOAD=${DEBUG:-false}

log_info "Configurações de execução:"
log_info "  Host: $HOST"
log_info "  Port: $PORT"
log_info "  Workers: $WORKERS"
log_info "  Reload: $RELOAD"
log_info "  Environment: ${ENVIRONMENT:-development}"

# Executar testes rápidos (opcional)
if [ "$1" = "--test" ]; then
    log_info "Executando testes..."
    python -m pytest tests/ -v --tb=short
    exit 0
fi

# Inicializar servidor
log_success "🎉 Iniciando servidor Mozaia LLM Orchestrator..."
log_info "API docs disponível em: http://$HOST:$PORT/docs"
log_info "Health check em: http://$HOST:$PORT/health"

if [ "$RELOAD" = "true" ]; then
    exec uvicorn main:app --host "$HOST" --port "$PORT" --reload
else
    exec uvicorn main:app --host "$HOST" --port "$PORT" --workers "$WORKERS"
fi
