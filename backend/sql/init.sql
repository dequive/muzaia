-- backend/sql/init.sql
-- Script de inicialização do banco de dados PostgreSQL para Mozaia

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Schema principal
CREATE SCHEMA IF NOT EXISTS mozaia;
SET search_path TO mozaia, public;

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
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    language_preference VARCHAR(10) DEFAULT 'pt-MZ',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    session_id UUID DEFAULT uuid_generate_v4(),
    title VARCHAR(500),
    context context_type DEFAULT 'general',
    status conversation_status DEFAULT 'active',
    message_count INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3,2),
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0.00,
    requires_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    message_text TEXT NOT NULL,
    response_text TEXT,
    context context_type DEFAULT 'general',
    confidence_score DECIMAL(3,2),
    consensus_score DECIMAL(3,2),
    models_used TEXT[], -- Array de nomes de modelos
    processing_time DECIMAL(8,3),
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0.00,
    requires_review BOOLEAN DEFAULT FALSE,
    is_streamed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Tabela de respostas individuais dos modelos
CREATE TABLE IF NOT EXISTS model_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    response_text TEXT NOT NULL,
    confidence DECIMAL(3,2),
    processing_time DECIMAL(8,3),
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0.00,
    error_message TEXT,
    is_outlier BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Tabela de feedback dos usuários
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    feedback_type feedback_type NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Usuário pode dar feedback apenas uma vez por mensagem
    UNIQUE(message_id, user_id)
);

-- Tabela de métricas do sistema
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6),
    metric_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índice para consultas por nome e data
    INDEX idx_system_metrics_name_date ON system_metrics(metric_name, recorded_at)
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cache de respostas
CREATE TABLE IF NOT EXISTS response_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    query_hash VARCHAR(64) NOT NULL,
    response_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    models_used TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance

-- Usuários
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Conversas
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_context ON conversations(context);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_requires_review ON conversations(requires_review);

-- Mensagens
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_context ON messages(context);
CREATE INDEX IF NOT EXISTS idx_messages_confidence_score ON messages(confidence_score);
CREATE INDEX IF NOT EXISTS idx_messages_requires_review ON messages(requires_review);
CREATE INDEX IF NOT EXISTS idx_messages_text_search ON messages USING gin(to_tsvector('portuguese', message_text));

-- Respostas dos modelos
CREATE INDEX IF NOT EXISTS idx_model_responses_message_id ON model_responses(message_id);
CREATE INDEX IF NOT EXISTS idx_model_responses_model_name ON model_responses(model_name);
CREATE INDEX IF NOT EXISTS idx_model_responses_created_at ON model_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_model_responses_confidence ON model_responses(confidence);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Métricas
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);

-- Logs de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Cache
CREATE INDEX IF NOT EXISTS idx_response_cache_key ON response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_response_cache_hash ON response_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_response_cache_expires ON response_cache(expires_at);

-- Triggers para atualização automática de timestamps

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estatísticas da conversa
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Atualizar contadores ao inserir nova mensagem
        UPDATE conversations 
        SET 
            message_count = message_count + 1,
            avg_confidence = (
                SELECT AVG(confidence_score) 
                FROM messages 
                WHERE conversation_id = NEW.conversation_id 
                AND confidence_score IS NOT NULL
            ),
            total_tokens = (
                SELECT COALESCE(SUM(tokens_used), 0) 
                FROM messages 
                WHERE conversation_id = NEW.conversation_id
            ),
            total_cost = (
                SELECT COALESCE(SUM(cost), 0) 
                FROM messages 
                WHERE conversation_id = NEW.conversation_id
            ),
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Recalcular estatísticas ao atualizar mensagem
        UPDATE conversations 
        SET 
            avg_confidence = (
                SELECT AVG(confidence_score) 
                FROM messages 
                WHERE conversation_id = NEW.conversation_id 
                AND confidence_score IS NOT NULL
            ),
            total_tokens = (
                SELECT COALESCE(SUM(tokens_used), 0) 
                FROM messages 
                WHERE conversation_id = NEW.conversation_id
            ),
            total_cost = (
                SELECT COALESCE(SUM(cost), 0) 
                FROM messages 
                WHERE conversation_id = NEW.conversation_id
            ),
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger para atualizar estatísticas da conversa
CREATE TRIGGER update_conversation_stats_trigger
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM response_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO system_metrics (metric_name, metric_value, metric_data)
    VALUES ('cache_cleanup', deleted_count, jsonb_build_object(
        'deleted_entries', deleted_count,
        'cleanup_time', NOW()
    ));
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Inserir configurações padrão do sistema
INSERT INTO system_config (config_key, config_value, description) VALUES
('max_cache_size', '10000', 'Número máximo de entradas no cache de respostas'),
('cache_ttl_hours', '24', 'Tempo de vida do cache em horas'),
('min_confidence_threshold', '0.65', 'Limite mínimo de confiança para respostas'),
('max_tokens_per_request', '4000', 'Número máximo de tokens por requisição'),
('enable_response_caching', 'true', 'Habilitar cache de respostas'),
('enable_audit_logging', 'true', 'Habilitar logs de auditoria'),
('feedback_reminder_days', '7', 'Dias para lembrar usuários de dar feedback'),
('auto_archive_days', '90', 'Dias para arquivar conversas automaticamente')
ON CONFLICT (config_key) DO NOTHING;

-- Views para relatórios e analytics

-- View de estatísticas de usuários
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.user_id,
    u.created_at as user_since,
    u.last_active,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(m.id) as total_messages,
    AVG(m.confidence_score) as avg_confidence,
    SUM(m.tokens_used) as total_tokens_used,
    SUM(m.cost) as total_cost,
    COUNT(f.id) as feedback_given,
    DATE_PART('day', NOW() - u.created_at) as days_active
FROM users u
LEFT JOIN conversations c ON u.user_id = c.user_id
LEFT JOIN messages m ON u.user_id = m.user_id
LEFT JOIN feedback f ON u.user_id = f.user_id
GROUP BY u.id, u.user_id, u.created_at, u.last_active;

-- View de performance dos modelos
CREATE OR REPLACE VIEW model_performance AS
SELECT 
    mr.model_name,
    COUNT(*) as total_responses,
    AVG(mr.confidence) as avg_confidence,
    AVG(mr.processing_time) as avg_processing_time,
    AVG(mr.tokens_used) as avg_tokens,
    AVG(mr.cost) as avg_cost,
    COUNT(*) FILTER (WHERE mr.is_outlier = true) as outlier_count,
    COUNT(*) FILTER (WHERE mr.error_message IS NOT NULL) as error_count,
    MAX(mr.created_at) as last_used
FROM model_responses mr
GROUP BY mr.model_name
ORDER BY total_responses DESC;

-- View de métricas diárias
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
    DATE(m.created_at) as date,
    COUNT(*) as total_messages,
    COUNT(DISTINCT m.user_id) as unique_users,
    COUNT(DISTINCT m.conversation_id) as total_conversations,
    AVG(m.confidence_score) as avg_confidence,
    AVG(m.processing_time) as avg_processing_time,
    SUM(m.tokens_used) as total_tokens,
    SUM(m.cost) as total_cost,
    COUNT(*) FILTER (WHERE m.requires_review = true) as messages_requiring_review
FROM messages m
GROUP BY DATE(m.created_at)
ORDER BY date DESC;

-- View de feedback agregado
CREATE OR REPLACE VIEW feedback_summary AS
SELECT 
    f.feedback_type,
    COUNT(*) as count,
    AVG(f.rating) as avg_rating,
    COUNT(*) FILTER (WHERE f.is_helpful = true) as helpful_count,
    COUNT(*) FILTER (WHERE f.is_helpful = false) as not_helpful_count
FROM feedback f
GROUP BY f.feedback_type;

-- Função para criar partições mensais (para grandes volumes)
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS VOID AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    -- Criar partições para os próximos 12 meses
    FOR i IN 0..11 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        end_date := start_date + INTERVAL '1 month';
        table_name := 'messages_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I PARTITION OF messages
            FOR VALUES FROM (%L) TO (%L)
        ', table_name, start_date, end_date);
    END LOOP;
END;
$$ language 'plpgsql';

-- Criar usuário de aplicação com permissões limitadas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mozaia_app') THEN
        CREATE ROLE mozaia_app WITH LOGIN PASSWORD 'mozaia_secure_2024!';
    END IF;
END
$$;

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA mozaia TO mozaia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA mozaia TO mozaia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA mozaia TO mozaia_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA mozaia TO mozaia_app;

-- Definir permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA mozaia 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mozaia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA mozaia 
    GRANT USAGE, SELECT ON SEQUENCES TO mozaia_app;

-- Log de inicialização
INSERT INTO system_metrics (metric_name, metric_value, metric_data)
VALUES ('database_initialized', 1, jsonb_build_object(
    'version', '1.0.0',
    'initialized_at', NOW(),
    'schema', 'mozaia'
));

-- Comentários nas tabelas para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema Mozaia';
COMMENT ON TABLE conversations IS 'Conversas entre usuários e o sistema';
COMMENT ON TABLE messages IS 'Mensagens individuais em conversas';
COMMENT ON TABLE model_responses IS 'Respostas individuais de cada modelo LLM';
COMMENT ON TABLE feedback IS 'Feedback dos usuários sobre as respostas';
COMMENT ON TABLE system_metrics IS 'Métricas de performance e uso do sistema';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para segurança e compliance';
COMMENT ON TABLE system_config IS 'Configurações do sistema';
COMMENT ON TABLE response_cache IS 'Cache de respostas para otimização';

COMMIT;
