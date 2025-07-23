-- CORRIGIR COLUNAS USER_ID EM FALTA
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar estrutura atual das tabelas
SELECT 
    '=== ESTRUTURA ATUAL DAS TABELAS ===' as info;

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('transactions', 'goals', 'categories', 'families', 'family_members')
AND column_name = 'user_id'
ORDER BY table_name;

-- 2. Adicionar user_id às tabelas que não têm
DO $$
BEGIN
    -- Adicionar user_id a transactions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna user_id adicionada a transactions';
    END IF;

    -- Adicionar user_id a goals
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'goals' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE goals ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna user_id adicionada a goals';
    END IF;

    -- Adicionar user_id a categories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna user_id adicionada a categories';
    END IF;
END $$;

-- 3. Verificar estrutura após alterações
SELECT 
    '=== ESTRUTURA APÓS ALTERAÇÕES ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('transactions', 'goals', 'categories')
AND column_name IN ('user_id', 'id', 'created_at')
ORDER BY table_name, column_name;

-- 4. Se já existem dados, precisamos atualizar com o user_id atual
-- ATENÇÃO: Isto vai atribuir TODOS os registos ao utilizador atual!
UPDATE transactions SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE goals SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE categories SET user_id = auth.uid() WHERE user_id IS NULL;

-- 5. Tornar user_id NOT NULL após atualização
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- 7. Verificar dados
SELECT 
    '=== VERIFICAR DADOS ===' as info;

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
FROM goals
UNION ALL
SELECT 
    'categories' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM categories; 