# syntax=docker/dockerfile:1

# --- Estágio de Build (builder) ---
<<<<<<< HEAD
# Usa uma imagem Python completa para instalar dependências e compilar artefatos.
=======
>>>>>>> c68eadc94a9784f20bcd404cc0f1fe129eef29de
FROM python:3.12 as builder

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
<<<<<<< HEAD
# Usa uma imagem slim, que é menor e mais segura para produção.
=======
>>>>>>> c68eadc94a9784f20bcd404cc0f1fe129eef29de
FROM python:3.12-slim as final

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

<<<<<<< HEAD
# Define o PATH para que os executáveis do virtualenv sejam encontrados
ENV PATH="/app/.venv/bin:$PATH"

# Copia o código-fonte da aplicação
COPY --chown=appuser:appuser ./app ./app
COPY --chown=appuser:appuser ./alembic ./alembic
COPY --chown=appuser:appuser main.py alembic.ini ./

# Expõe a porta em que a aplicação será executada
EXPOSE 8001

# Define um Health Check robusto para o container
# Verifica se a aplicação está respondendo corretamente antes de marcar o container como saudável.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD [ "python", "-c", "import httpx; exit(0) if httpx.get('http://localhost:8001/health').status_code == 200 else exit(1)" ]

# Comando para iniciar a aplicação em produção com Uvicorn e múltiplos workers.
# --proxy-headers: necessário para que a aplicação funcione corretamente atrás de um proxy reverso (como NGINX ou Traefik).
=======
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Comando para iniciar a aplicação
>>>>>>> c68eadc94a9784f20bcd404cc0f1fe129eef29de
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4", "--proxy-headers"]
