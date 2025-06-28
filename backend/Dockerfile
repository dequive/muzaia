# backend/Dockerfile

# --- Estágio de Build ---
FROM python:3.11-slim-bullseye AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Criar um ambiente virtual para isolar as dependências
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copiar e instalar dependências primeiro para otimizar o cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Estágio Final ---
FROM python:3.11-slim-bullseye AS final

# Criar um utilizador não-root para segurança
RUN groupadd --system app && useradd --system --gid app app

WORKDIR /app

# Copiar o ambiente virtual do estágio de build
COPY --from=builder /opt/venv /opt/venv

# Copiar o código da aplicação
COPY . .

# Definir o PATH para usar o ambiente virtual
ENV PATH="/opt/venv/bin:$PATH"

# Mudar para o utilizador não-root
USER app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
