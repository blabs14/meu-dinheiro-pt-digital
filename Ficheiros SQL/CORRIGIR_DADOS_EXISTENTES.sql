-- CORRIGIR DADOS EXISTENTES
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Obter o ID do utilizador atual
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obter o ID do utilizador atual
    current_user_id := auth.uid();
    
    RAISE NOTICE 'Utilizador atual: %', current_user_id;
    
    -- 2. Atualizar categories com user_id NULL
    UPDATE categories 
    SET user_id = current_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Categories atualizadas';
    
    -- 3. Atualizar transactions com user_id NULL
    UPDATE transactions 
    SET user_id = current_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Transactions atualizadas';
    
    -- 4. Atualizar goals com user_id NULL
    UPDATE goals 
    SET user_id = current_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Goals atualizadas';
    
    -- 5. Verificar se ainda há NULLs
    IF EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL) THEN
        RAISE NOTICE 'Ainda há categories com user_id NULL';
    ELSE
        RAISE NOTICE 'Todas as categories têm user_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM transactions WHERE user_id IS NULL) THEN
        RAISE NOTICE 'Ainda há transactions com user_id NULL';
    ELSE
        RAISE NOTICE 'Todas as transactions têm user_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM goals WHERE user_id IS NULL) THEN
        RAISE NOTICE 'Ainda há goals com user_id NULL';
    ELSE
        RAISE NOTICE 'Todas as goals têm user_id';
    END IF;
    
END $$;

-- 6. Verificar resultado
SELECT 
    '=== VERIFICAÇÃO FINAL ===' as info;

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