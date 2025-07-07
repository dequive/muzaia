# syntax=docker/dockerfile:1

# --- Estágio de Build (builder) ---
# Usa uma imagem Python completa para instalar dependências e compilar artefatos.
FROM python:3.11 as builder

# Define o diretório de trabalho
WORKDIR /app

# Instala o Poetry, uma ferramenta moderna para gerenciamento de dependências
ENV POETRY_VERSION=1.7.1
RUN pip install "poetry==$POETRY_VERSION"

# ---- INÍCIO DA CORREÇÃO ----
# Configura o Poetry para criar o virtualenv dentro do diretório do projeto
RUN poetry config virtualenvs.in-project true
# ---- FIM DA CORREÇÃO ----

# Copia os arquivos de definição de dependências
COPY poetry.lock pyproject.toml ./

# Instala as dependências de produção, sem as de desenvolvimento, e cria um virtualenv dentro do projeto.
# --no-root: não instala o projeto em si, apenas as dependências.
RUN poetry install --no-interaction --no-ansi --no-dev --no-root

# --- Estágio Final (final) ---
# Usa uma imagem slim, que é menor e mais segura para produção.
FROM python:3.11-slim as final

# Define o diretório de trabalho
WORKDIR /app

# Define variáveis de ambiente para otimizar a execução em produção
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    POETRY_VIRTUALENVS_CREATE=false

# Cria um usuário não-root para executar a aplicação, por segurança.
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

# Copia o ambiente virtual com as dependências do estágio de build
COPY --from=builder /app/.venv .venv

# Define o PATH para que os executáveis do virtualenv sejam encontrados
ENV PATH="/app/.venv/bin:$PATH"

# Copia o código-fonte da aplicação
COPY --chown=appuser:appuser ./app ./app
COPY --chown=appuser:appuser ./alembic ./alembic
COPY --chown=appuser:appuser main.py alembic.ini ./

# Expõe a porta em que a aplicação será executada
EXPOSE 8000

# Define um Health Check robusto para o container
# Verifica se a aplicação está respondendo corretamente antes de marcar o container como saudável.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD [ "python", "-c", "import httpx; exit(0) if httpx.get('http://localhost:8000/health').status_code == 200 else exit(1)" ]

# Comando para iniciar a aplicação em produção com Uvicorn e múltiplos workers.
# --proxy-headers: necessário para que a aplicação funcione corretamente atrás de um proxy reverso (como NGINX ou Traefik).
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]
