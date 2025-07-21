-- TORNAR USER_ID NOT NULL
-- Execute este script APÓS corrigir os dados existentes

-- 1. Tornar user_id NOT NULL em todas as tabelas
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- 3. Verificar estrutura final
SELECT 
    '=== ESTRUTURA FINAL ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('categories', 'transactions', 'goals')
AND column_name = 'user_id'
ORDER BY table_name;

-- 4. Verificar dados
SELECT 
    '=== DADOS FINAIS ===' as info;

SELECT 
    'categories' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM categories
UNION ALL
SELECT 
    'transactions' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM transactions
UNION ALL
SELECT 
    'goals' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM goals; 