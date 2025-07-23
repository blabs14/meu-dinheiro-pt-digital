-- INSERIR DADOS SEM ON CONFLICT
-- Execute este script APÓS executar CORRIGIR_CONSTRAINT_E_USER_ID.sql

-- 1. INSERIR CATEGORIAS DE TESTE (SEM ON CONFLICT)
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

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Saúde', 'despesa', '#06b6d4', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Saúde' AND user_id = auth.uid()
);

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Casa', 'despesa', '#f97316', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Casa' AND user_id = auth.uid()
);

INSERT INTO categories (nome, tipo, cor, user_id)
SELECT 'Vestuário', 'despesa', '#ec4899', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE nome = 'Vestuário' AND user_id = auth.uid()
);

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
SELECT auth.uid(), 2500.00, 'receita', (SELECT salario_id FROM cat_ids), '2025-01-05', 'Salário Janeiro 2025', 'pessoal', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM transactions 
    WHERE user_id = auth.uid() 
    AND descricao = 'Salário Janeiro 2025' 
    AND data = '2025-01-05'
);

-- 3. VERIFICAR DADOS INSERIDOS
SELECT 
    '=== CATEGORIAS ===' as info;
SELECT 
    id,
    nome,
    tipo,
    user_id
FROM categories 
WHERE user_id = auth.uid()
ORDER BY nome;

SELECT 
    '=== TRANSAÇÕES ===' as info;
SELECT 
    id,
    valor,
    tipo,
    data,
    descricao
FROM transactions 
WHERE user_id = auth.uid()
ORDER BY data DESC
LIMIT 10;

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