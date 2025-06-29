# backend/alembic/env.py
"""Configuração do Alembic para migrações do banco de dados."""
import asyncio
import os
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Importar modelos para que o Alembic possa detectá-los
from app.database.models import Base
from app.core.config import settings

# Configuração do Alembic
config = context.config

# Configurar logging se disponível
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadados dos modelos
target_metadata = Base.metadata

# Configurar URL do banco de dados
config.set_main_option("sqlalchemy.url", str(settings.database.url))


def run_migrations_offline() -> None:
    """
    Executa migrações em modo 'offline'.
    
    Configura o contexto apenas com uma URL e não com um Engine,
    embora um Engine também seja aceitável. Pulando a criação
    do Engine, não precisamos de um pool de conexões DBAPI.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema="mozaia",  # Schema específico para versões
        include_schemas=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def include_object(object, name, type_, reflected, compare_to):
    """
    Determina quais objetos incluir nas migrações.
    """
    # Incluir apenas objetos do schema mozaia
    if type_ == "table" and object.schema != "mozaia":
        return False
    return True


def do_run_migrations(connection: Connection) -> None:
    """Executa migrações com conexão fornecida."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table_schema="mozaia",
        include_schemas=True,
        include_object=include_object,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Executa migrações em modo assíncrono."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = str(settings.database.url)
    
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Executa migrações em modo 'online'."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
