-- CORRIGIR CONSTRAINT E USER_ID
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. ADICIONAR CONSTRAINT ÚNICO PARA CATEGORIES
-- Primeiro, verificar se já existe
DO $$
BEGIN
    -- Adicionar constraint único se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'categories_nome_user_id_key'
    ) THEN
        ALTER TABLE categories 
        ADD CONSTRAINT categories_nome_user_id_key 
        UNIQUE (nome, user_id);
        RAISE NOTICE 'Adicionado constraint único para (nome, user_id) em categories';
    ELSE
        RAISE NOTICE 'Constraint único já existe em categories';
    END IF;
END $$;

-- 2. ATUALIZAR USER_ID EM CATEGORIES (se ainda houver NULLs)
UPDATE categories 
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- 3. TORNAR USER_ID NOT NULL EM CATEGORIES
DO $$
BEGIN
    -- Verificar se há NULLs antes de tornar NOT NULL
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL) THEN
        ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'user_id em categories tornado NOT NULL';
    ELSE
        RAISE NOTICE 'Ainda há categories com user_id NULL';
    END IF;
END $$;

-- 4. VERIFICAR ESTRUTURA FINAL
SELECT 
    '=== ESTRUTURA FINAL CATEGORIES ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 5. VERIFICAR CONSTRAINTS
SELECT 
    '=== CONSTRAINTS CATEGORIES ===' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'categories'::regclass;

-- 6. VERIFICAR DADOS
SELECT 
    '=== DADOS CATEGORIES ===' as info;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as sem_user_id
FROM categories; 