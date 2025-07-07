# syntax=docker/dockerfile:1

# --- Estágio de Build (builder) ---
FROM python:3.11 as builder

WORKDIR /app

# Instala o Poetry
ENV POETRY_VERSION=1.7.1
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# Configura o Poetry
RUN poetry config virtualenvs.in-project true

# Copia os arquivos de definição de dependências
COPY poetry.lock pyproject.toml ./

# Instala as dependências do projeto
RUN poetry install --no-interaction --no-ansi --no-root

# Copia o código-fonte da aplicação
COPY ./app ./app
COPY ./alembic ./alembic
COPY main.py alembic.ini ./

# --- Estágio Final (final) ---
FROM python:3.11-slim as final

WORKDIR /app

# Define variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    POETRY_VIRTUALENVS_CREATE=false \
    PATH="/app/.venv/bin:$PATH"

# Cria usuário não-root
RUN useradd --create-home --shell /bin/bash appuser

# Instala dependências necessárias para o healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia o ambiente virtual e o código
COPY --from=builder /app/.venv .venv
COPY --from=builder /app/app ./app
COPY --from=builder /app/alembic ./alembic
COPY --from=builder /app/main.py /app/alembic.ini ./

# Ajusta as permissões
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4", "--proxy-headers"]
