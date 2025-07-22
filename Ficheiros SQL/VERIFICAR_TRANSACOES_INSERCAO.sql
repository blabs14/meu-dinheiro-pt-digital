-- VERIFICAR TRANSAÇÕES E INSERÇÃO
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR TRANSAÇÕES EXISTENTES
SELECT 
    '=== TRANSAÇÕES EXISTENTES ===' as info;
SELECT 
    id,
    user_id,
    valor,
    tipo,
    data,
    descricao,
    created_at
FROM transactions 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 2. VERIFICAR CATEGORIAS DISPONÍVEIS
SELECT 
    '=== CATEGORIAS DISPONÍVEIS ===' as info;
SELECT 
    id,
    nome,
    tipo,
    user_id
FROM categories 
WHERE user_id = auth.uid()
ORDER BY nome;

-- 3. INSERIR TRANSAÇÃO DE TESTE MANUAL
WITH cat_id AS (
    SELECT id FROM categories 
    WHERE nome = 'Salário' AND user_id = auth.uid() 
    LIMIT 1
)
INSERT INTO transactions (user_id, valor, tipo, categoria_id, data, descricao, modo, family_id)
SELECT 
    auth.uid(),
    100.00,
    'receita',
    (SELECT id FROM cat_id),
    '2025-01-20',
    'Teste Manual - Receita',
    'pessoal',
    NULL
WHERE EXISTS (SELECT 1 FROM cat_id);

-- 4. VERIFICAR SE FOI INSERIDA
SELECT 
    '=== TRANSAÇÃO INSERIDA ===' as info;
SELECT 
    id,
    user_id,
    valor,
    tipo,
    data,
    descricao,
    created_at
FROM transactions 
WHERE user_id = auth.uid()
AND descricao = 'Teste Manual - Receita'
ORDER BY created_at DESC
LIMIT 1;

-- 5. CALCULAR TOTAIS ATUAIS
SELECT 
    '=== TOTAIS ATUAIS ===' as info;
SELECT 
    tipo,
    COUNT(*) as quantidade,
    SUM(valor) as total
FROM transactions 
WHERE user_id = auth.uid()
GROUP BY tipo; 