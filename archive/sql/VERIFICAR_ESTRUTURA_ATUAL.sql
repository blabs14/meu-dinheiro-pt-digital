-- VERIFICAR ESTRUTURA ATUAL DAS TABELAS
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar estrutura da tabela categories
SELECT 
    '=== ESTRUTURA CATEGORIES ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela transactions
SELECT 
    '=== ESTRUTURA TRANSACTIONS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela goals
SELECT 
    '=== ESTRUTURA GOALS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position;

-- 4. Verificar dados existentes
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