-- CRIAR ESTRUTURA CORRETA DAS TABELAS
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Adicionar user_id à tabela categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Adicionar user_id à tabela transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Adicionar user_id à tabela goals
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. Adicionar colunas em falta à tabela goals
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS valor_meta DECIMAL(10,2);

ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS valor_atual DECIMAL(10,2) DEFAULT 0;

-- 5. Adicionar family_id às tabelas se não existir
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS family_id UUID;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS family_id UUID;

ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS family_id UUID;

-- 6. Verificar estrutura final
SELECT 
    '=== ESTRUTURA FINAL CATEGORIES ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

SELECT 
    '=== ESTRUTURA FINAL TRANSACTIONS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

SELECT 
    '=== ESTRUTURA FINAL GOALS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position; 