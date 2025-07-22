-- TESTE DIRETO DE TRANSAÇÕES
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Obter o ID do utilizador atual
SELECT 
    auth.uid() as current_user_id;

-- 2. Verificar se existem categorias
SELECT 
    id,
    nome,
    tipo,
    user_id
FROM categories
WHERE user_id = auth.uid()
LIMIT 5;

-- 3. Tentar inserir uma transação de teste
INSERT INTO transactions (
    user_id,
    valor,
    tipo,
    data,
    descricao,
    modo,
    family_id
) VALUES (
    auth.uid(),
    100.00,
    'receita',
    CURRENT_DATE,
    'Teste direto SQL',
    'pessoal',
    NULL
) RETURNING *;

-- 4. Verificar se a transação foi inserida
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
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 5. Testar a query que o componente usa
SELECT 
    t.id,
    t.valor,
    t.data,
    t.tipo,
    t.descricao,
    t.modo,
    t.family_id,
    t.user_id,
    t.created_at,
    c.nome as categoria_nome,
    c.cor as categoria_cor
FROM transactions t
LEFT JOIN categories c ON t.categoria_id = c.id
WHERE t.user_id = auth.uid()
AND t.family_id IS NULL
ORDER BY t.data DESC
LIMIT 10; 