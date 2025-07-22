-- VERIFICAR ESTRUTURA DA TABELA PROFILES
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 
    '=== ESTRUTURA PROFILES ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS DE EXEMPLO
SELECT 
    '=== DADOS PROFILES ===' as info;
SELECT 
    id,
    nome,
    created_at,
    updated_at
FROM profiles 
LIMIT 5;

-- 3. VERIFICAR SE EXISTE COLUNA EMAIL
SELECT 
    '=== VERIFICAR EMAIL ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'email'
        ) THEN 'Coluna email existe'
        ELSE 'Coluna email NÃO existe'
    END as email_column_status; 