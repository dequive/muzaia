#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de configuração do banco de dados da aplicação Muzaia.

Realiza as seguintes operações:
1. Verifica conexão com o banco
2. Executa migrações necessárias
3. Popula dados iniciais
4. Valida a estrutura do banco
"""

import os
import sys
import logging
import asyncio
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

# Constantes
SCHEMA_NAME = "muzaia"  # Nome do schema, consistente com o nome do projeto
ROOT_DIR = Path(__file__).parent.parent
SQL_DIR = ROOT_DIR / "sql"
ENV_FILE = ROOT_DIR / ".env"


# Classe para gerenciar conexões de banco de dados
class DatabaseManager:
    """Gerenciador de conexões com o banco de dados."""
    
    def __init__(
        self,
        host: str,
        port: int,
        user: str,
        password: str,
        database: str
    ):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.pool = None
        
    async def initialize(self):
        """Inicializa o pool de conexões."""
        import asyncpg
        
        try:
            logger.info(f"Conectando ao banco {self.database} em {self.host}:{self.port}")
            self.pool = await asyncpg.create_pool(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                min_size=1,
                max_size=5
            )
            logger.info("✅ Conexão com o banco estabelecida")
        except Exception as e:
            logger.error(f"❌ Falha ao conectar ao banco: {e}")
            raise
    
    async def close(self):
        """Fecha o pool de conexões."""
        if self.pool:
            await self.pool.close()
            logger.info("Conexão com o banco fechada")
    
    async def execute(self, query: str) -> None:
        """Executa uma query no banco de dados."""
        if not self.pool:
            raise Exception("Pool de conexões não inicializado")
        
        async with self.pool.acquire() as conn:
            await conn.execute(query)
    
    async def get_session(self):
        """Obtém uma sessão de conexão com o banco."""
        if not self.pool:
            raise Exception("Pool de conexões não inicializado")
        return self.pool.acquire()
    
    async def execute_script(self, path: Path) -> None:
        """Executa um script SQL."""
        if not path.exists():
            raise FileNotFoundError(f"Arquivo SQL não encontrado: {path}")
        
        logger.info(f"Executando script SQL: {path}")
        script = path.read_text()
        
        async with self.pool.acquire() as conn:
            await conn.execute(script)


async def load_env() -> Dict[str, str]:
    """Carrega variáveis de ambiente do arquivo .env"""
    env_vars = {}
    
    if ENV_FILE.exists():
        with open(ENV_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip().strip('"\'')
    
    # Priorizar variáveis do ambiente
    for key, value in os.environ.items():
        env_vars[key] = value
    
    return env_vars


async def setup_database(args: argparse.Namespace) -> None:
    """Configura o banco de dados."""
    
    # Carregar variáveis de ambiente
    env = await load_env()
    
    # Criar gerenciador de banco
    db_manager = DatabaseManager(
        host=args.host or env.get("DB_HOST", "localhost"),
        port=int(args.port or env.get("DB_PORT", "5432")),
        user=args.user or env.get("DB_USER", "muzaia_user"),
        password=args.password or env.get("DB_PASSWORD", "muzaia_password"),
        database=args.dbname or env.get("DB_NAME", "muzaia_db")
    )
    
    try:
        # Inicializar conexão
        await db_manager.initialize()
        
        # Executar script de inicialização se necessário
        if args.init:
            init_script = SQL_DIR / "init.sql"
            await db_manager.execute_script(init_script)
            logger.info("✅ Banco inicializado com sucesso")
        
        # Executar migrações
        if args.migrate:
            await run_migrations(db_manager)
            logger.info("✅ Migrações executadas com sucesso")
        
        # Verificar estrutura do banco
        await verify_database_setup(db_manager)
        
    except Exception as e:
        logger.error(f"❌ Erro na configuração do banco: {e}")
        raise
    finally:
        # Fechar conexão
        await db_manager.close()


async def run_migrations(db_manager: DatabaseManager) -> None:
    """Executa migrações pendentes."""
    migrations_dir = SQL_DIR / "migrations"
    
    if not migrations_dir.exists():
        logger.warning("Diretório de migrações não encontrado")
        return
    
    # Verificar se tabela de migrações existe
    try:
        async with db_manager.get_session() as session:
            result = await session.fetchval(
                f"SELECT EXISTS (SELECT FROM information_schema.tables "
                f"WHERE table_schema = '{SCHEMA_NAME}' AND table_name = 'migrations')"
            )
            
            if not result:
                # Criar tabela de migrações se não existir
                await session.execute(
                    f"CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.migrations ("
                    f"id SERIAL PRIMARY KEY, "
                    f"name VARCHAR(255) NOT NULL, "
                    f"applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
                )
    except Exception as e:
        logger.error(f"Erro ao verificar tabela de migrações: {e}")
        raise
    
    # Obter migrações já aplicadas
    async with db_manager.get_session() as session:
        applied = await session.fetch(f"SELECT name FROM {SCHEMA_NAME}.migrations")
        applied_migrations = {row['name'] for row in applied}
    
    # Obter arquivos de migração
    migration_files = sorted([f for f in migrations_dir.glob("*.sql")])
    
    # Aplicar migrações pendentes
    for migration_file in migration_files:
        name = migration_file.name
        
        if name in applied_migrations:
            logger.info(f"Migração já aplicada: {name}")
            continue
        
        logger.info(f"Aplicando migração: {name}")
        
        try:
            await db_manager.execute_script(migration_file)
            
            # Registrar migração
            async with db_manager.get_session() as session:
                await session.execute(
                    f"INSERT INTO {SCHEMA_NAME}.migrations (name) VALUES ($1)",
                    name
                )
            
            logger.info(f"✅ Migração aplicada: {name}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao aplicar migração {name}: {e}")
            raise


async def verify_database_setup(db_manager: DatabaseManager) -> None:
    """Verifica se o banco está configurado corretamente."""
    
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
                    f"WHERE table_schema = '{SCHEMA_NAME}' AND table_name = '{table}'"
                )
                count = result.scalar()
                
                if count == 0:
                    raise Exception(f"Tabela {table} não encontrada")
            
            # Verificar dados básicos
            result = await session.execute(f"SELECT COUNT(*) FROM {SCHEMA_NAME}.system_config")
            config_count = result.scalar()
            
            if config_count == 0:
                raise Exception("Configurações do sistema não encontradas")
            
            logger.info("✅ Verificação do setup concluída com sucesso")
            
    except Exception as e:
        logger.error(f"❌ Verificação do banco falhou: {e}")
        raise


def parse_args() -> argparse.Namespace:
    """Analisa argumentos da linha de comando."""
    parser = argparse.ArgumentParser(description="Setup do banco de dados Muzaia")
    
    parser.add_argument("--host", help="Host do banco de dados")
    parser.add_argument("--port", help="Porta do banco de dados")
    parser.add_argument("--user", help="Usuário do banco de dados")
    parser.add_argument("--password", help="Senha do banco de dados")
    parser.add_argument("--dbname", help="Nome do banco de dados")
    
    parser.add_argument("--init", action="store_true", help="Inicializar banco de dados")
    parser.add_argument("--migrate", action="store_true", help="Executar migrações")
    parser.add_argument("--verify", action="store_true", help="Verificar estrutura do banco")
    
    args = parser.parse_args()
    
    # Se nenhuma ação foi especificada, assumir todas
    if not (args.init or args.migrate or args.verify):
        args.init = True
        args.migrate = True
        args.verify = True
    
    return args


async def main() -> None:
    """Função principal."""
    logger.info("🗄️ Iniciando setup do banco de dados Muzaia")
    
    try:
        args = parse_args()
        await setup_database(args)
        logger.info("🎉 Setup do banco de dados concluído com sucesso")
    except Exception as e:
        logger.error(f"💥 Erro no setup do banco de dados: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
