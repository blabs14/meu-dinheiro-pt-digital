-- INSERIR TRANSAÇÃO DE TESTE
-- Execute este script APÓS corrigir user_id em categories e transactions

-- 1. OBTER ID DE UMA CATEGORIA
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

-- 2. INSERIR TRANSAÇÃO DE TESTE
WITH cat_id AS (
    SELECT id FROM categories 
    WHERE nome = 'Salário' AND user_id = auth.uid() 
    LIMIT 1
)
INSERT INTO transactions (user_id, valor, tipo, categoria_id, data, descricao, modo, family_id)
SELECT 
    auth.uid(),
    2500.00,
    'receita',
    (SELECT id FROM cat_id),
    '2025-01-05',
    'Salário Janeiro 2025 - TESTE',
    'pessoal',
    NULL
WHERE EXISTS (SELECT 1 FROM cat_id);

-- 3. VERIFICAR TRANSAÇÃO INSERIDA
SELECT 
    '=== TRANSAÇÃO INSERIDA ===' as info;
SELECT 
    id,
    valor,
    tipo,
    data,
    descricao,
    user_id
FROM transactions 
WHERE user_id = auth.uid()
AND descricao = 'Salário Janeiro 2025 - TESTE'
ORDER BY created_at DESC
LIMIT 1;

-- 4. CALCULAR TOTAIS
SELECT 
    '=== TOTAIS ===' as info;
SELECT 
    tipo,
    COUNT(*) as quantidade,
    SUM(valor) as total
FROM transactions 
WHERE user_id = auth.uid()
GROUP BY tipo; 