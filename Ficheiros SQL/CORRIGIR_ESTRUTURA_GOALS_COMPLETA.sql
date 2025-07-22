-- CORRIGIR ESTRUTURA COMPLETA DA TABELA GOALS
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Adicionar colunas em falta à tabela goals
DO $$
BEGIN
    -- Adicionar valor_meta se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'valor_meta'
    ) THEN
        ALTER TABLE goals ADD COLUMN valor_meta DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Coluna valor_meta adicionada';
    END IF;

    -- Adicionar valor_atual se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'valor_atual'
    ) THEN
        ALTER TABLE goals ADD COLUMN valor_atual DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Coluna valor_atual adicionada';
    END IF;

    -- Adicionar status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'status'
    ) THEN
        ALTER TABLE goals ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Coluna status adicionada';
    END IF;

    -- Adicionar nome se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'nome'
    ) THEN
        ALTER TABLE goals ADD COLUMN nome VARCHAR(255) NOT NULL DEFAULT 'Meta sem nome';
        RAISE NOTICE 'Coluna nome adicionada';
    END IF;

    -- Adicionar descricao se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'descricao'
    ) THEN
        ALTER TABLE goals ADD COLUMN descricao TEXT;
        RAISE NOTICE 'Coluna descricao adicionada';
    END IF;

    -- Adicionar data_limite se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'data_limite'
    ) THEN
        ALTER TABLE goals ADD COLUMN data_limite DATE;
        RAISE NOTICE 'Coluna data_limite adicionada';
    END IF;
END $$;

-- 2. Atualizar registos existentes
UPDATE goals SET status = 'active' WHERE status IS NULL;
UPDATE goals SET valor_meta = 0 WHERE valor_meta IS NULL;
UPDATE goals SET valor_atual = 0 WHERE valor_atual IS NULL;

-- 3. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position; 