#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de setup do banco de dados Mozaia.

Este script:
- Cria o banco de dados se não existir
- Executa migrações do Alembic
- Popula dados iniciais
- Configura usuários e permissões
"""
import asyncio
import logging
import sys
from pathlib import Path

import asyncpg
import click
from sqlalchemy.ext.asyncio import create_async_engine

# Adicionar o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.database.connection import db_manager
from app.database.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_database_if_not_exists():
    """Cria o banco de dados se não existir."""
    # Parse da URL para obter componentes
    import urllib.parse as urlparse
    
    parsed = urlparse.urlparse(settings.database.url)
    
    # Conectar ao postgres padrão para criar o banco
    admin_url = f"postgresql://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port}/postgres"
    
    try:
        conn = await asyncpg.connect(admin_url)
        
        # Verificar se banco existe
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            parsed.path.lstrip('/')
        )
        
        if not exists:
            # Criar banco de dados
            await conn.execute(f'CREATE DATABASE "{parsed.path.lstrip("/")}"')
            logger.info(f"✅ Banco de dados '{parsed.path.lstrip('/')}' criado")
        else:
            logger.info(f"ℹ️  Banco de dados '{parsed.path.lstrip('/')}' já existe")
        
        await conn.close()
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar banco de dados: {e}")
        raise


async def create_tables():
    """Cria todas as tabelas usando SQLAlchemy."""
    try:
        # Remover +asyncpg da URL para create_engine síncrono
        sync_url = settings.database.url.replace("+asyncpg", "")
        
        engine = create_async_engine(sync_url)
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        await engine.dispose()
        logger.info("✅ Tabelas criadas com sucesso")
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar tabelas: {e}")
        raise


async def run_sql_script(script_path: Path):
    """Executa script SQL."""
    if not script_path.exists():
        logger.warning(f"⚠️  Script não encontrado: {script_path}")
        return
    
    try:
        # Parse da URL
        import urllib.parse as urlparse
        parsed = urlparse.urlparse(settings.database.url)
        
        # Conectar diretamente ao banco
        conn = await asyncpg.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path.lstrip('/')
        )
        
        # Ler e executar script
        sql_content = script_path.read_text(encoding='utf-8')
        await conn.execute(sql_content)
        await conn.close()
        
        logger.info(f"✅ Script executado: {script_path.name}")
        
    except Exception as e:
        logger.error(f"❌ Erro ao executar script {script_path.name}: {e}")
        raise


async def populate_initial_data():
    """Popula dados iniciais no banco."""
    try:
        async with db_manager.get_session() as session:
            # Importar modelos
            from app.database.models import SystemConfig, User
            
            # Verificar se já existem dados
            result = await session.execute("SELECT COUNT(*) FROM mozaia.system_config")
            count = result.scalar()
            
            if count > 0:
                logger.info("ℹ️  Dados iniciais já existem")
                return
            
            # Criar configurações padrão
            default_configs = [
                SystemConfig(
                    config_key="app_version",
                    config_value={"version": settings.app_version},
                    description="Versão atual da aplicação"
                ),
                SystemConfig(
                    config_key="maintenance_mode",
                    config_value={"enabled": False},
                    description="Modo de manutenção"
                ),
                SystemConfig(
                    config_key="max_users_per_day",
                    config_value={"limit": 1000},
                    description="Limite de novos usuários por dia"
                ),
                SystemConfig(
                    config_key="default_language",
                    config_value={"language": "pt-MZ"},
                    description="Idioma padrão do sistema"
                ),
            ]
            
            for config in default_configs:
                session.add(config)
            
            await session.commit()
            logger.info("✅ Dados iniciais populados")
            
    except Exception as e:
        logger.error(f"❌ Erro ao popular dados iniciais: {e}")
        raise


async def create_admin_user():
    """Cria usuário administrador padrão."""
    try:
        async with db_manager.get_session() as session:
            from app.database.models import User
            
            # Verificar se admin já existe
            result = await session.execute(
                "SELECT id FROM mozaia.users WHERE user_id = 'admin'"
            )
            existing = result.scalar()
            
            if existing:
                logger.info("ℹ️  Usuário admin já existe")
                return
            
            # Criar admin
            admin_user = User(
                user_id="admin",
                email="admin@mozaia.mz",
                first_name="Admin",
                last_name="System",
                language_preference="pt-MZ",
                is_active=True,
                metadata={
                    "role": "admin",
                    "created_by": "setup_script",
                    "permissions": ["all"]
                }
            )
            
            session.add(admin_user)
            await session.commit()
            
            logger.info("✅ Usuário admin criado")
            
    except Exception as e:
        logger.error(f"❌ Erro ao criar usuário admin: {e}")
        raise


async def verify_setup():
    """Verifica se o setup foi executado corretamente."""
    try:
        async with db_manager.get_session() as session:
            # Verificar tabelas principais
            tables_to_check = [
                "users", "conversations", "messages", 
                "model_responses", "feedback", "system_config"
            ]
            
            for table in tables_to_check:
                result = await session.execute(
                    f"SELECT COUNT(*) FROM information_schema.tables "
                    f"WHERE table_schema = 'mozaia' AND table_name = '{table}'"
                )
                count = result.scalar()
                
                if count == 0:
                    raise Exception(f"Tabela {table} não encontrada")
            
            # Verificar dados básicos
            result = await session.execute("SELECT COUNT(*) FROM mozaia.system_config")
            config_count = result.scalar()
            
            if config_count == 0:
                raise Exception("Configurações do sistema não encontradas")
            
            logger.info("✅ Verificação do setup concluída com sucesso")
            
    except Exception as e:
        logger.error(f"❌ Erro na verificação: {e}")
        raise


@click.command()
@click.option('--force', is_flag=True, help='Força recriar banco mesmo se existir')
@click.option('--skip-data', is_flag=True, help='Pula população de dados iniciais')
@click.option('--skip-admin', is_flag=True, help='Pula criação do usuário admin')
@click.option('--verify-only', is_flag=True, help='Apenas verifica o setup')
async def main(force: bool, skip_data: bool, skip_admin: bool, verify_only: bool):
    """Script principal de setup do banco de dados."""
    
    logger.info("🚀 Iniciando setup do banco de dados Mozaia...")
    
    try:
        if verify_only:
            logger.info("🔍 Verificando setup existente...")
            await db_manager.initialize()
            await verify_setup()
            return
        
        # 1. Criar banco se não existir
        if not force:
            await create_database_if_not_exists()
        
        # 2. Inicializar gerenciador de DB
        await db_manager.initialize()
        
        # 3. Executar script de inicialização SQL
        sql_script_path = Path(__file__).parent.parent / "sql" / "init.sql"
        if sql_script_path.exists():
            await run_sql_script(sql_script_path)
        
        # 4. Criar tabelas via SQLAlchemy
        await create_tables()
        
        # 5. Popular dados iniciais
        if not skip_data:
            await populate_initial_data()
        
        # 6. Criar usuário admin
        if not skip_admin:
            await create_admin_user()
        
        # 7. Verificar setup
        await verify_setup()
        
        logger.info("🎉 Setup do banco de dados concluído com sucesso!")
        
    except Exception as e:
        logger.error(f"💥 Erro no setup: {e}")
        sys.exit(1)
    
    finally:
        await db_manager.close()


if __name__ == "__main__":
    asyncio.run(main())
