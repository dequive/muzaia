-- backend/sql/init.sql
-- Script de inicialização do banco de dados PostgreSQL para Muzaia

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Schema principal
CREATE SCHEMA IF NOT EXISTS muzaia;
SET search_path TO muzaia, public;

-- Enum para tipos de contexto
CREATE TYPE context_type AS ENUM (
    'general',
    'legal',
    'technical',
    'business',
    'academic'
);

-- Enum para status de conversas
CREATE TYPE conversation_status AS ENUM (
    'active',
    'completed',
    'requires_review',
    'archived'
);

-- Enum para tipos de feedback
CREATE TYPE feedback_type AS ENUM (
    'helpful',
    'not_helpful',
    'incorrect',
    'incomplete',
    'inappropriate'
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}'
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    context context_type DEFAULT 'general',
    status conversation_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Índices para conversas
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0
);

-- Índices para mensagens
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Tabela de respostas dos modelos
CREATE TABLE IF NOT EXISTS model_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    processing_time FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Índices para respostas dos modelos
CREATE INDEX idx_model_responses_message_id ON model_responses(message_id);
CREATE INDEX idx_model_responses_model_name ON model_responses(model_name);

-- Tabela de feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    feedback_type feedback_type NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Índices para feedback
CREATE INDEX idx_feedback_message_id ON feedback(message_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de métricas do sistema
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para métricas
CREATE INDEX idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_created_at ON system_metrics(created_at);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    context JSONB DEFAULT '{}'
);

-- Índices para logs
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_source ON system_logs(source);

-- Configurações iniciais do sistema
INSERT INTO system_config (config_key, config_value, description)
VALUES 
    ('default_models', '["llama3:8b", "gemma2:9b"]', 'Modelos padrão para o orquestrador'),
    ('consensus_threshold', '0.75', 'Limiar para consenso semântico'),
    ('cache_settings', '{"ttl": 3600, "max_size": 1000}', 'Configurações de cache do sistema'),
    ('rate_limits', '{"per_user": {"requests": 100, "timeframe": 60}}', 'Limites de taxa do sistema');

-- Criar usuário para a aplicação (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'muzaia_app'
    ) THEN
        CREATE ROLE muzaia_app LOGIN PASSWORD 'muzaia_app_password';
    END IF;
END$$;

-- Conceder permissões
GRANT USAGE ON SCHEMA muzaia TO muzaia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA muzaia TO muzaia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA muzaia TO muzaia_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA muzaia TO muzaia_app;

-- Definir permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA muzaia 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO muzaia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA muzaia 
    GRANT USAGE, SELECT ON SEQUENCES TO muzaia_app;

-- Log de inicialização
INSERT INTO system_metrics (metric_name, metric_value, metric_data)
VALUES ('database_initialized', 1, jsonb_build_object(
    'version', '1.0.0',
    'initialized_at', NOW(),
    'schema', 'muzaia'
));

-- Comentários nas tabelas para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema Muzaia';
COMMENT ON TABLE conversations IS 'Conversas entre usuários e o sistema Muzaia';
COMMENT ON TABLE messages IS 'Mensagens trocadas em conversas do Muzaia';
COMMENT ON TABLE model_responses IS 'Respostas individuais de cada modelo LLM do Muzaia';
COMMENT ON TABLE feedback IS 'Feedback dos usuários sobre respostas do Muzaia';
COMMENT ON TABLE system_config IS 'Configurações do sistema Muzaia';
COMMENT ON TABLE system_metrics IS 'Métricas de uso e performance do sistema Muzaia';
COMMENT ON TABLE system_logs IS 'Logs de eventos do sistema Muzaia';
