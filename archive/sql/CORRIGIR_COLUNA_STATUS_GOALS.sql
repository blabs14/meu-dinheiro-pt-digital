-- Adicionar coluna status à tabela goals
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar estrutura atual da tabela goals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position;

-- 2. Adicionar coluna status se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'status'
    ) THEN
        ALTER TABLE goals ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Coluna status adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela goals';
    END IF;
END $$;

-- 3. Atualizar registos existentes para ter status 'active'
UPDATE goals SET status = 'active' WHERE status IS NULL;

-- 4. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position;

-- 5. Verificar dados
SELECT id, nome, valor_meta, valor_atual, status FROM goals LIMIT 10; 