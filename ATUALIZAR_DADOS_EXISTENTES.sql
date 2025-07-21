-- ATUALIZAR DADOS EXISTENTES COM USER_ID
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Atualizar categories com user_id
UPDATE categories 
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- 2. Atualizar transactions com user_id
UPDATE transactions 
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- 3. Atualizar goals com user_id
UPDATE goals 
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- 4. Atualizar goals com valores padrão se estiverem NULL
UPDATE goals 
SET status = 'active'
WHERE status IS NULL;

UPDATE goals 
SET valor_atual = 0
WHERE valor_atual IS NULL;

-- 5. Verificar dados atualizados
SELECT 
    '=== DADOS ATUALIZADOS ===' as info;

SELECT 
    'categories' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id
FROM categories
UNION ALL
SELECT 
    'transactions' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id
FROM transactions
UNION ALL
SELECT 
    'goals' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id
FROM goals; 