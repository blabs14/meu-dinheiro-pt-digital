-- VERIFICAR DADOS EXISTENTES E CORRIGIR USER_ID
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar dados existentes
SELECT 
    '=== DADOS EXISTENTES ===' as info;

SELECT 
    'categories' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as com_user_id_null,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id_preenchido
FROM categories
UNION ALL
SELECT 
    'transactions' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as com_user_id_null,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id_preenchido
FROM transactions
UNION ALL
SELECT 
    'goals' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as com_user_id_null,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id_preenchido
FROM goals;

-- 2. Verificar utilizadores ativos
SELECT 
    '=== UTILIZADORES ATIVOS ===' as info;
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Obter o ID do utilizador atual
SELECT 
    '=== UTILIZADOR ATUAL ===' as info;
SELECT 
    auth.uid() as user_id_atual; 