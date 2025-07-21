-- INSERIR DADOS DE TESTE FINAL
-- Execute este script APÓS executar ATUALIZAR_DADOS_APOS_ESTRUTURA.sql

-- 1. INSERIR CATEGORIAS DE TESTE
INSERT INTO categories (nome, tipo, cor, user_id)
VALUES 
    ('Salário', 'receita', '#10b981', auth.uid()),
    ('Freelance', 'receita', '#059669', auth.uid()),
    ('Alimentação', 'despesa', '#ef4444', auth.uid()),
    ('Transporte', 'despesa', '#f59e0b', auth.uid()),
    ('Lazer', 'despesa', '#8b5cf6', auth.uid()),
    ('Saúde', 'despesa', '#06b6d4', auth.uid()),
    ('Educação', 'despesa', '#84cc16', auth.uid()),
    ('Casa', 'despesa', '#f97316', auth.uid()),
    ('Vestuário', 'despesa', '#ec4899', auth.uid()),
    ('Poupança', 'receita', '#22c55e', auth.uid())
ON CONFLICT (nome, user_id) DO NOTHING;

-- 2. INSERIR TRANSAÇÕES DE JANEIRO 2025
WITH cat_ids AS (
    SELECT 
        (SELECT id FROM categories WHERE nome = 'Salário' AND user_id = auth.uid() LIMIT 1) as salario_id,
        (SELECT id FROM categories WHERE nome = 'Freelance' AND user_id = auth.uid() LIMIT 1) as freelance_id,
        (SELECT id FROM categories WHERE nome = 'Alimentação' AND user_id = auth.uid() LIMIT 1) as alimentacao_id,
        (SELECT id FROM categories WHERE nome = 'Transporte' AND user_id = auth.uid() LIMIT 1) as transporte_id,
        (SELECT id FROM categories WHERE nome = 'Lazer' AND user_id = auth.uid() LIMIT 1) as lazer_id,
        (SELECT id FROM categories WHERE nome = 'Saúde' AND user_id = auth.uid() LIMIT 1) as saude_id,
        (SELECT id FROM categories WHERE nome = 'Casa' AND user_id = auth.uid() LIMIT 1) as casa_id,
        (SELECT id FROM categories WHERE nome = 'Vestuário' AND user_id = auth.uid() LIMIT 1) as vestuario_id
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
    (auth.uid(), 75.00, 'despesa', (SELECT lazer_id FROM cat_ids), '2025-01-22', 'Saída com Amigos', 'pessoal', NULL),
    (auth.uid(), 45.00, 'despesa', (SELECT saude_id FROM cat_ids), '2025-01-16', 'Consulta Médica', 'pessoal', NULL),
    (auth.uid(), 200.00, 'despesa', (SELECT casa_id FROM cat_ids), '2025-01-03', 'Conta da Luz', 'pessoal', NULL),
    (auth.uid(), 120.00, 'despesa', (SELECT casa_id FROM cat_ids), '2025-01-17', 'Conta da Água', 'pessoal', NULL),
    (auth.uid(), 85.00, 'despesa', (SELECT vestuario_id FROM cat_ids), '2025-01-11', 'Roupa Nova', 'pessoal', NULL);

-- 3. INSERIR METAS DE TESTE
INSERT INTO goals (user_id, nome, descricao, valor_meta, valor_atual, status, data_limite, family_id)
VALUES 
    (auth.uid(), 'Fundo de Emergência', 'Poupar para emergências', 5000.00, 1250.00, 'active', '2025-06-30', NULL),
    (auth.uid(), 'Férias de Verão', 'Poupar para férias', 2000.00, 800.00, 'active', '2025-08-15', NULL),
    (auth.uid(), 'Novo Computador', 'Poupar para computador', 1500.00, 300.00, 'active', '2025-12-31', NULL),
    (auth.uid(), 'Entrada Casa', 'Poupar para entrada de casa', 25000.00, 5000.00, 'active', '2026-12-31', NULL);

-- 4. VERIFICAR DADOS INSERIDOS
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

-- 5. CALCULAR TOTAIS DE JANEIRO
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

-- 6. VERIFICAR METAS
SELECT 
    '=== METAS ATIVAS ===' as info;
SELECT 
    id,
    nome,
    valor_meta,
    valor_atual,
    ROUND((valor_atual / valor_meta) * 100, 2) as percentagem
FROM goals 
WHERE user_id = auth.uid()
AND status = 'active'
ORDER BY percentagem DESC;

-- 7. VERIFICAÇÃO FINAL DOS DADOS
SELECT 
    '=== VERIFICAÇÃO FINAL ===' as info;
SELECT 
    'categories' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM categories
WHERE user_id = auth.uid()
UNION ALL
SELECT 
    'transactions' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM transactions
WHERE user_id = auth.uid()
UNION ALL
SELECT 
    'goals' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT user_id) as usuarios_distintos
FROM goals
WHERE user_id = auth.uid(); 