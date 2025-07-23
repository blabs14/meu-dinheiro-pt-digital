-- TORNAR USER_ID OBRIGATÓRIO
-- Execute este script APÓS atualizar os dados

-- 1. Tornar user_id NOT NULL
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_family_id ON categories(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_family_id ON transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_goals_family_id ON goals(family_id);

-- 3. Verificar estrutura final
SELECT 
    '=== ESTRUTURA FINAL ===' as info;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'transactions', 'goals')
AND column_name IN ('user_id', 'family_id', 'status', 'valor_meta', 'valor_atual')
ORDER BY table_name, column_name; 