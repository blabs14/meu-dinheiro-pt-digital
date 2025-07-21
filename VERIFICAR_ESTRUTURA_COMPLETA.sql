-- VERIFICAR ESTRUTURA COMPLETA DAS TABELAS
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Estrutura da tabela transactions
SELECT 
    '=== ESTRUTURA DA TABELA TRANSACTIONS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 2. Estrutura da tabela goals
SELECT 
    '=== ESTRUTURA DA TABELA GOALS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals'
ORDER BY ordinal_position;

-- 3. Estrutura da tabela categories
SELECT 
    '=== ESTRUTURA DA TABELA CATEGORIES ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 4. Verificar dados de exemplo
SELECT 
    '=== EXEMPLO DE TRANSAÇÕES ===' as info;
SELECT * FROM transactions LIMIT 5;

SELECT 
    '=== EXEMPLO DE METAS ===' as info;
SELECT * FROM goals LIMIT 5;

SELECT 
    '=== EXEMPLO DE CATEGORIAS ===' as info;
SELECT * FROM categories LIMIT 5; 