-- INSERIR TRANSAÇÕES DO MÊS ATUAL
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar o mês atual
SELECT 
    CURRENT_DATE as data_atual,
    EXTRACT(MONTH FROM CURRENT_DATE) as mes_atual,
    EXTRACT(YEAR FROM CURRENT_DATE) as ano_atual;

-- 2. Verificar se existem categorias
SELECT 
    id,
    nome,
    tipo,
    cor
FROM categories
WHERE user_id = auth.uid()
LIMIT 10;

-- 3. Criar categorias se não existirem
INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Salário', 'receita', '#10b981', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Salário' AND user_id = auth.uid()
);

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Alimentação', 'despesa', '#ef4444', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Alimentação' AND user_id = auth.uid()
);

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Transporte', 'despesa', '#f59e0b', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Transporte' AND user_id = auth.uid()
);

-- 4. Inserir transações do mês atual
WITH cat_ids AS (
    SELECT 
        (SELECT id FROM categories WHERE nome = 'Salário' AND user_id = auth.uid() LIMIT 1) as salario_id,
        (SELECT id FROM categories WHERE nome = 'Alimentação' AND user_id = auth.uid() LIMIT 1) as alimentacao_id,
        (SELECT id FROM categories WHERE nome = 'Transporte' AND user_id = auth.uid() LIMIT 1) as transporte_id
)
INSERT INTO transactions (user_id, valor, tipo, categoria_id, data, descricao, modo, family_id)
VALUES 
    -- Receitas
    (auth.uid(), 2500.00, 'receita', (SELECT salario_id FROM cat_ids), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days', 'Salário Janeiro 2025', 'pessoal', NULL),
    (auth.uid(), 500.00, 'receita', (SELECT salario_id FROM cat_ids), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '15 days', 'Freelance', 'pessoal', NULL),
    
    -- Despesas
    (auth.uid(), 150.00, 'despesa', (SELECT alimentacao_id FROM cat_ids), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 days', 'Compras Supermercado', 'pessoal', NULL),
    (auth.uid(), 80.00, 'despesa', (SELECT alimentacao_id FROM cat_ids), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 days', 'Restaurante', 'pessoal', NULL),
    (auth.uid(), 50.00, 'despesa', (SELECT transporte_id FROM cat_ids), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '10 days', 'Combustível', 'pessoal', NULL),
    (auth.uid(), 120.00, 'despesa', (SELECT alimentacao_id FROM cat_ids), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '12 days', 'Compras Continente', 'pessoal', NULL);

-- 5. Verificar transações inseridas
SELECT 
    '=== TRANSAÇÕES DO MÊS ATUAL ===' as info;
SELECT 
    id,
    valor,
    tipo,
    data,
    descricao,
    EXTRACT(MONTH FROM data) as mes,
    EXTRACT(YEAR FROM data) as ano
FROM transactions 
WHERE user_id = auth.uid()
AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY data DESC;

-- 6. Calcular totais do mês
SELECT 
    '=== TOTAIS DO MÊS ATUAL ===' as info;
SELECT 
    tipo,
    COUNT(*) as quantidade,
    SUM(valor) as total
FROM transactions 
WHERE user_id = auth.uid()
AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY tipo; 