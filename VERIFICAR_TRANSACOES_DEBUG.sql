-- Script de Debug para Transações
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar todas as transações
SELECT 
    id,
    user_id,
    valor,
    tipo,
    data,
    descricao,
    family_id,
    created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Contar transações por utilizador
SELECT 
    user_id,
    COUNT(*) as total_transacoes,
    COUNT(CASE WHEN family_id IS NULL THEN 1 END) as transacoes_pessoais,
    COUNT(CASE WHEN family_id IS NOT NULL THEN 1 END) as transacoes_familiares,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
FROM transactions 
GROUP BY user_id
ORDER BY total_transacoes DESC;

-- 3. Verificar transações do mês atual
SELECT 
    CASE 
        WHEN family_id IS NULL THEN 'Pessoais'
        ELSE 'Familiares'
    END as tipo_transacao,
    COUNT(*) as total,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesas
FROM transactions 
WHERE data >= '2025-01-01' 
AND data < '2025-02-01'
GROUP BY 
    CASE 
        WHEN family_id IS NULL THEN 'Pessoais'
        ELSE 'Familiares'
    END;

-- 4. Verificar se há transações com family_id inválido
SELECT 
    'Transações com family_id inválido' as problema,
    COUNT(*) as total
FROM transactions t
WHERE t.family_id IS NOT NULL 
AND t.family_id NOT IN (SELECT id FROM families);

-- 5. Verificar estrutura da tabela transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 6. Verificar RLS policies na tabela transactions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'transactions'; 