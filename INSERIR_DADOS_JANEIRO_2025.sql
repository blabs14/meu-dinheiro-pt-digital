-- INSERIR DADOS DE TESTE PARA JANEIRO 2025
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Criar categorias se não existirem
INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Salário', 'receita', '#10b981', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Salário' AND user_id = auth.uid()
);

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Freelance', 'receita', '#059669', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Freelance' AND user_id = auth.uid()
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

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Lazer', 'despesa', '#8b5cf6', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Lazer' AND user_id = auth.uid()
);

-- 2. Inserir transações de janeiro 2025
WITH cat_ids AS (
    SELECT 
        (SELECT id FROM categories WHERE nome = 'Salário' AND user_id = auth.uid() LIMIT 1) as salario_id,
        (SELECT id FROM categories WHERE nome = 'Freelance' AND user_id = auth.uid() LIMIT 1) as freelance_id,
        (SELECT id FROM categories WHERE nome = 'Alimentação' AND user_id = auth.uid() LIMIT 1) as alimentacao_id,
        (SELECT id FROM categories WHERE nome = 'Transporte' AND user_id = auth.uid() LIMIT 1) as transporte_id,
        (SELECT id FROM categories WHERE nome = 'Lazer' AND user_id = auth.uid() LIMIT 1) as lazer_id
)
INSERT INTO transactions (user_id, valor, tipo, categoria_id, data, descricao, modo, family_id)
VALUES 
    -- Receitas Janeiro 2025
    (auth.uid(), 2500.00, 'receita', (SELECT salario_id FROM cat_ids), '2025-01-05', 'Salário Janeiro 2025', 'pessoal', NULL),
    (auth.uid(), 800.00, 'receita', (SELECT freelance_id FROM cat_ids), '2025-01-15', 'Projeto Freelance', 'pessoal', NULL),
    (auth.uid(), 300.00, 'receita', (SELECT freelance_id FROM cat_ids), '2025-01-25', 'Consultoria', 'pessoal', NULL),
    
    -- Despesas Janeiro 2025
    (auth.uid(), 150.00, 'despesa', (SELECT alimentacao_id FROM cat_ids), '2025-01-02', 'Compras Supermercado', 'pessoal', NULL),
    (auth.uid(), 80.00, 'despesa', (SELECT alimentacao_id FROM cat_ids), '2025-01-08', 'Restaurante', 'pessoal', NULL),
    (auth.uid(), 120.00, 'despesa', (SELECT alimentacao_id FROM cat_ids), '2025-01-12', 'Compras Continente', 'pessoal', NULL),
    (auth.uid(), 60.00, 'despesa', (SELECT alimentacao_id FROM cat_ids), '2025-01-18', 'Café e Pastéis', 'pessoal', NULL),
    (auth.uid(), 50.00, 'despesa', (SELECT transporte_id FROM cat_ids), '2025-01-10', 'Combustível', 'pessoal', NULL),
    (auth.uid(), 30.00, 'despesa', (SELECT transporte_id FROM cat_ids), '2025-01-20', 'Bilhete de Comboio', 'pessoal', NULL),
    (auth.uid(), 100.00, 'despesa', (SELECT lazer_id FROM cat_ids), '2025-01-14', 'Cinema e Jantar', 'pessoal', NULL),
    (auth.uid(), 75.00, 'despesa', (SELECT lazer_id FROM cat_ids), '2025-01-22', 'Saída com Amigos', 'pessoal', NULL);

-- 3. Inserir meta de teste
INSERT INTO goals (user_id, nome, descricao, valor_meta, valor_atual, status, data_limite, family_id)
VALUES (
    auth.uid(),
    'Fundo de Emergência',
    'Poupar para emergências',
    5000.00,
    1250.00,
    'active',
    '2025-06-30',
    NULL
);

-- 4. Verificar dados inseridos
SELECT 
    '=== TRANSAÇÕES JANEIRO 2025 ===' as info;
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
AND EXTRACT(MONTH FROM data) = 1
AND EXTRACT(YEAR FROM data) = 2025
ORDER BY data DESC;

-- 5. Calcular totais de janeiro
SELECT 
    '=== TOTAIS JANEIRO 2025 ===' as info;
SELECT 
    tipo,
    COUNT(*) as quantidade,
    SUM(valor) as total
FROM transactions 
WHERE user_id = auth.uid()
AND EXTRACT(MONTH FROM data) = 1
AND EXTRACT(YEAR FROM data) = 2025
GROUP BY tipo; 