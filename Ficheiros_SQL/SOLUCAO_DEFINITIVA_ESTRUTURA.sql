-- SOLUÇÃO DEFINITIVA - CRIAR ESTRUTURA COMPLETA
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT 
    '=== ESTRUTURA ATUAL ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'transactions', 'goals')
ORDER BY table_name, ordinal_position;

-- 2. CRIAR COLUNAS SE NÃO EXISTIREM
DO $$
BEGIN
    -- Adicionar user_id às tabelas se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN user_id UUID;
        RAISE NOTICE 'Adicionada coluna user_id à tabela categories';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela categories';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN user_id UUID;
        RAISE NOTICE 'Adicionada coluna user_id à tabela transactions';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela transactions';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE goals ADD COLUMN user_id UUID;
        RAISE NOTICE 'Adicionada coluna user_id à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela goals';
    END IF;

    -- Adicionar family_id às tabelas se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'family_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN family_id UUID;
        RAISE NOTICE 'Adicionada coluna family_id à tabela categories';
    ELSE
        RAISE NOTICE 'Coluna family_id já existe na tabela categories';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'family_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN family_id UUID;
        RAISE NOTICE 'Adicionada coluna family_id à tabela transactions';
    ELSE
        RAISE NOTICE 'Coluna family_id já existe na tabela transactions';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'family_id'
    ) THEN
        ALTER TABLE goals ADD COLUMN family_id UUID;
        RAISE NOTICE 'Adicionada coluna family_id à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna family_id já existe na tabela goals';
    END IF;

    -- Adicionar colunas específicas da tabela goals
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'status'
    ) THEN
        ALTER TABLE goals ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Adicionada coluna status à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna status já existe na tabela goals';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'valor_meta'
    ) THEN
        ALTER TABLE goals ADD COLUMN valor_meta DECIMAL(10,2);
        RAISE NOTICE 'Adicionada coluna valor_meta à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna valor_meta já existe na tabela goals';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'valor_atual'
    ) THEN
        ALTER TABLE goals ADD COLUMN valor_atual DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Adicionada coluna valor_atual à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna valor_atual já existe na tabela goals';
    END IF;

END $$;

-- 3. VERIFICAR ESTRUTURA FINAL
SELECT 
    '=== ESTRUTURA FINAL ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'transactions', 'goals')
ORDER BY table_name, ordinal_position;

-- 4. VERIFICAR DADOS EXISTENTES
SELECT 
    '=== DADOS EXISTENTES ===' as info;

SELECT 
    'categories' as tabela,
    COUNT(*) as total_registos
FROM categories
UNION ALL
SELECT 
    'transactions' as tabela,
    COUNT(*) as total_registos
FROM transactions
UNION ALL
SELECT 
    'goals' as tabela,
    COUNT(*) as total_registos
FROM goals; 