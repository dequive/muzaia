#!/bin/bash
# backend/scripts/start.sh
# Script de inicialização do backend Muzaia

set -e  # Exit on any error

echo "🚀 Iniciando Muzaia LLM Orchestrator Backend..."

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

# Verificar ambiente virtual
if [ -z "$VIRTUAL_ENV" ] && [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    log_warning "Ambiente virtual não detectado. Recomenda-se usar um ambiente virtual."
    read -p "Deseja continuar sem ambiente virtual? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Executando 'python -m venv venv' para criar ambiente virtual..."
        python -m venv venv
        
        if [ $? -eq 0 ]; then
            log_success "Ambiente virtual criado. Ative-o com:"
            echo "  source venv/bin/activate  # Linux/macOS"
            echo "  .\\venv\\Scripts\\activate  # Windows"
            exit 0
        else
            log_error "Falha ao criar ambiente virtual. Verifique se python3-venv está instalado."
            exit 1
        fi
    fi
fi

# Verificar dependências
log_info "Verificando dependências..."
if [ ! -f "requirements.txt" ]; then
    log_error "requirements.txt não encontrado"
    exit 1
fi

# Instalar ou atualizar dependências se necessário
if [ "$1" = "--update-deps" ] || [ ! -f ".deps_installed" ]; then
    log_info "Instalando/atualizando dependências..."
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        touch .deps_installed
        log_success "✅ Dependências instaladas com sucesso"
    else
        log_error "❌ Falha na instalação das dependências"
        exit 1
    fi
fi

# Verificar configuração
if [ ! -f ".env" ] && [ ! -f ".env.development" ]; then
    log_warning "Arquivo .env não encontrado. Criando .env padrão..."
    cp .env.example .env || true
fi

# Executar migrações do banco se solicitado
if [ "$1" = "--migrate" ] || [ "$2" = "--migrate" ]; then
    log_info "Executando migrações do banco de dados..."
    python scripts/setup_db.py
    
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
                 -d "{\"name\":\"$model\"}" \
                 --silent
            
            if [ $? -eq 0 ]; then
                log_success "✅ Modelo $model baixado com sucesso"
            else
                log_warning "⚠️ Falha ao baixar modelo $model"
            fi
        else
            log_info "✅ Modelo $model já está disponível"
        fi
    done
fi

# Determinar o modo de execução
if [ "$1" = "--production" ] || [ "$APP_ENV" = "production" ]; then
    log_info "Iniciando servidor em modo de produção..."
    uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000} --workers=${WORKERS:-4} --proxy-headers
elif [ "$1" = "--dev" ] || [ "$APP_ENV" = "development" ]; then
    log_info "Iniciando servidor em modo de desenvolvimento com auto-reload..."
    uvicorn main:app --reload --host=0.0.0.0 --port=${PORT:-8000}
else
    # Modo padrão (detectar automaticamente)
    if [ -f ".env" ] && grep -q "APP_ENV=production" .env; then
        log_info "Iniciando servidor em modo de produção (detectado de .env)..."
        uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000} --workers=${WORKERS:-4} --proxy-headers
    else
        log_info "Iniciando servidor em modo de desenvolvimento..."
        uvicorn main:app --reload --host=0.0.0.0 --port=${PORT:-8000}
    fi
fi
