-- ATUALIZAR DADOS APÓS CRIAR ESTRUTURA
-- Execute este script APÓS executar SOLUCAO_DEFINITIVA_ESTRUTURA.sql

-- 1. ATUALIZAR DADOS EXISTENTES COM USER_ID
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obter o ID do utilizador atual
    current_user_id := auth.uid();
    
    RAISE NOTICE 'Utilizador atual: %', current_user_id;
    
    -- Atualizar categories
    UPDATE categories 
    SET user_id = current_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Categories atualizadas: % registos', (SELECT COUNT(*) FROM categories WHERE user_id = current_user_id);
    
    -- Atualizar transactions
    UPDATE transactions 
    SET user_id = current_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Transactions atualizadas: % registos', (SELECT COUNT(*) FROM transactions WHERE user_id = current_user_id);
    
    -- Atualizar goals
    UPDATE goals 
    SET user_id = current_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Goals atualizadas: % registos', (SELECT COUNT(*) FROM goals WHERE user_id = current_user_id);
    
    -- Atualizar valores padrão em goals
    UPDATE goals 
    SET status = 'active'
    WHERE status IS NULL;
    
    UPDATE goals 
    SET valor_atual = 0
    WHERE valor_atual IS NULL;
    
    RAISE NOTICE 'Valores padrão atualizados em goals';
    
END $$;

-- 2. VERIFICAR DADOS ATUALIZADOS
SELECT 
    '=== DADOS ATUALIZADOS ===' as info;

SELECT 
    'categories' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM categories
UNION ALL
SELECT 
    'transactions' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM transactions
UNION ALL
SELECT 
    'goals' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM goals;

-- 3. TORNAR USER_ID NOT NULL (apenas se não houver NULLs)
DO $$
BEGIN
    -- Verificar se há NULLs antes de tornar NOT NULL
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL) THEN
        ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'user_id em categories tornado NOT NULL';
    ELSE
        RAISE NOTICE 'Ainda há categories com user_id NULL';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id IS NULL) THEN
        ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'user_id em transactions tornado NOT NULL';
    ELSE
        RAISE NOTICE 'Ainda há transactions com user_id NULL';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM goals WHERE user_id IS NULL) THEN
        ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'user_id em goals tornado NOT NULL';
    ELSE
        RAISE NOTICE 'Ainda há goals com user_id NULL';
    END IF;
END $$;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_family_id ON categories(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_family_id ON transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_goals_family_id ON goals(family_id);

-- 5. VERIFICAÇÃO FINAL
SELECT 
    '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'transactions', 'goals')
AND column_name IN ('user_id', 'family_id', 'status', 'valor_meta', 'valor_atual')
ORDER BY table_name, column_name; 