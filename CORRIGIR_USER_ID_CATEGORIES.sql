-- CORRIGIR USER_ID EM CATEGORIES
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR DADOS ATUAIS
SELECT 
    '=== DADOS ATUAIS ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM categories;

-- 2. OBTER ID DO UTILIZADOR ATUAL
SELECT 
    '=== UTILIZADOR ATUAL ===' as info;
SELECT 
    auth.uid() as user_id_atual;

-- 3. ATUALIZAR TODAS AS CATEGORIAS COM USER_ID
UPDATE categories 
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- 4. VERIFICAR SE FOI ATUALIZADO
SELECT 
    '=== APÓS UPDATE ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM categories;

-- 5. MOSTRAR CATEGORIAS ATUALIZADAS
SELECT 
    '=== CATEGORIAS ATUALIZADAS ===' as info;
SELECT 
    id,
    nome,
    tipo,
    user_id
FROM categories 
ORDER BY nome; 