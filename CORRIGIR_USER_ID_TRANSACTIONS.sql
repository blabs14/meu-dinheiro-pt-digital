-- CORRIGIR USER_ID EM TRANSACTIONS
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR DADOS ATUAIS
SELECT 
    '=== DADOS ATUAIS TRANSACTIONS ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM transactions;

-- 2. ATUALIZAR TODAS AS TRANSACTIONS COM USER_ID
UPDATE transactions 
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- 3. VERIFICAR SE FOI ATUALIZADO
SELECT 
    '=== APÓS UPDATE TRANSACTIONS ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM transactions;

-- 4. MOSTRAR ALGUMAS TRANSACTIONS ATUALIZADAS
SELECT 
    '=== TRANSACTIONS ATUALIZADAS ===' as info;
SELECT 
    id,
    valor,
    tipo,
    data,
    descricao,
    user_id
FROM transactions 
WHERE user_id = auth.uid()
ORDER BY data DESC
LIMIT 10; 