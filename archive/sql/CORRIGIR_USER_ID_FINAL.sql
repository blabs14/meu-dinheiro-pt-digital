-- CORRIGIR USER_ID FINAL
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar estrutura atual
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'transactions', 'goals')
AND column_name = 'user_id'
ORDER BY table_name;

-- 2. Se user_id não existir, adicionar
DO $$
BEGIN
    -- Categories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        UPDATE categories SET user_id = auth.uid() WHERE user_id IS NULL;
        ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Coluna user_id adicionada a categories';
    END IF;

    -- Transactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        UPDATE transactions SET user_id = auth.uid() WHERE user_id IS NULL;
        ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Coluna user_id adicionada a transactions';
    END IF;

    -- Goals
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE goals ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        UPDATE goals SET user_id = auth.uid() WHERE user_id IS NULL;
        ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Coluna user_id adicionada a goals';
    END IF;
END $$;

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- 4. Verificar se funcionou
SELECT 
    'categories' as tabela,
    COUNT(*) as total_registos,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM categories
UNION ALL
SELECT 
    'transactions' as tabela,
    COUNT(*) as total_registos,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM transactions
UNION ALL
SELECT 
    'goals' as tabela,
    COUNT(*) as total_registos,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM goals; 