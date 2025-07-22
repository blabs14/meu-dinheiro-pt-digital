-- INSERIR DADOS DE TESTE COMPLETOS
-- Execute este script no Supabase Dashboard SQL Editor
-- ATENÇÃO: Substitua 'SEU_USER_ID' pelo ID real do utilizador

-- 1. Inserir categorias de teste se não existirem
INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Salário', 'receita', '#10b981', 'SEU_USER_ID'
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Salário' AND user_id = 'SEU_USER_ID'
);

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Supermercado', 'despesa', '#ef4444', 'SEU_USER_ID'
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Supermercado' AND user_id = 'SEU_USER_ID'
);

-- 2. Obter IDs das categorias
WITH cat_ids AS (
    SELECT 
        (SELECT id FROM categories WHERE nome = 'Salário' AND user_id = 'SEU_USER_ID' LIMIT 1) as receita_id,
        (SELECT id FROM categories WHERE nome = 'Supermercado' AND user_id = 'SEU_USER_ID' LIMIT 1) as despesa_id
)
-- 3. Inserir transações de teste para o mês atual
INSERT INTO transactions (user_id, valor, tipo, categoria_id, data, descricao, modo, family_id)
SELECT 
    'SEU_USER_ID',
    2500.00,
    'receita',
    cat_ids.receita_id,
    CURRENT_DATE - INTERVAL '15 days',
    'Salário Janeiro',
    'pessoal',
    NULL
FROM cat_ids;

INSERT INTO transactions (user_id, valor, tipo, categoria_id, data, descricao, modo, family_id)
SELECT 
    'SEU_USER_ID',
    150.00,
    'despesa',
    cat_ids.despesa_id,
    CURRENT_DATE - INTERVAL '10 days',
    'Compras Continente',
    'pessoal',
    NULL
FROM cat_ids;

INSERT INTO transactions (user_id, valor, tipo, categoria_id, data, descricao, modo, family_id)
SELECT 
    'SEU_USER_ID',
    85.50,
    'despesa',
    cat_ids.despesa_id,
    CURRENT_DATE - INTERVAL '5 days',
    'Compras Pingo Doce',
    'pessoal',
    NULL
FROM cat_ids;

-- 4. Inserir meta de teste
INSERT INTO goals (user_id, nome, descricao, valor_meta, valor_atual, status, data_limite, family_id)
VALUES (
    'SEU_USER_ID',
    'Fundo de Emergência',
    'Poupar para emergências',
    5000.00,
    1250.00,
    'active',
    CURRENT_DATE + INTERVAL '6 months',
    NULL
);

-- 5. Verificar dados inseridos
SELECT 
    '=== TRANSAÇÕES INSERIDAS ===' as info;
SELECT 
    id,
    valor,
    tipo,
    data,
    descricao,
    family_id
FROM transactions 
WHERE user_id = 'SEU_USER_ID'
ORDER BY created_at DESC 
LIMIT 10;

SELECT 
    '=== METAS INSERIDAS ===' as info;
SELECT 
    id,
    nome,
    valor_meta,
    valor_atual,
    status,
    family_id
FROM goals 
WHERE user_id = 'SEU_USER_ID'
ORDER BY created_at DESC; 