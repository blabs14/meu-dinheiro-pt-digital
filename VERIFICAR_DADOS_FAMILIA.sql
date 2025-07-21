-- ==========================================
-- VERIFICAÇÃO: DADOS DA FAMÍLIA
-- ==========================================

-- Este script verifica se há dados para calcular as estatísticas da família

-- ==========================================
-- ETAPA 1: VERIFICAR FAMÍLIA
-- ==========================================

SELECT 'Verificando Família' as teste;
SELECT 
    f.id,
    f.nome,
    f.created_at
FROM families f
WHERE f.nome = 'familia matias';

-- ==========================================
-- ETAPA 2: VERIFICAR TRANSAÇÕES FAMILIARES
-- ==========================================

SELECT 'Verificando Transações Familiares' as teste;
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN family_id IS NOT NULL THEN 1 END) as family_transactions,
    COUNT(CASE WHEN family_id IS NULL THEN 1 END) as personal_transactions
FROM transactions;

-- ==========================================
-- ETAPA 3: VERIFICAR TRANSAÇÕES DA FAMÍLIA ESPECÍFICA
-- ==========================================

SELECT 'Transações da Família Específica' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id,
    f.nome as family_name
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
WHERE t.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY t.created_at DESC;

-- ==========================================
-- ETAPA 4: VERIFICAR TRANSAÇÕES DO MÊS ATUAL
-- ==========================================

SELECT 'Transações do Mês Atual' as teste;
SELECT 
    'Total' as tipo,
    COUNT(*) as count
FROM transactions
WHERE data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
UNION ALL
SELECT 
    'Familiares' as tipo,
    COUNT(*) as count
FROM transactions
WHERE family_id IS NOT NULL
  AND data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
UNION ALL
SELECT 
    'Pessoais' as tipo,
    COUNT(*) as count
FROM transactions
WHERE family_id IS NULL
  AND data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ==========================================
-- ETAPA 5: VERIFICAR TRANSAÇÕES DA FAMÍLIA NO MÊS ATUAL
-- ==========================================

SELECT 'Transações da Família no Mês Atual' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id,
    f.nome as family_name
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
WHERE t.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
  AND t.data >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY t.data DESC;

-- ==========================================
-- ETAPA 6: CRIAR DADOS DE TESTE SE NECESSÁRIO
-- ==========================================

-- Se não houver transações familiares, criar algumas para teste
-- (Execute apenas se não houver dados)

/*
INSERT INTO transactions (
    user_id, 
    tipo, 
    valor, 
    data, 
    categoria_id, 
    descricao, 
    modo, 
    family_id
) VALUES 
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'receita',
    1500.00,
    CURRENT_DATE,
    NULL,
    'Salário Familiar',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
),
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'despesa',
    800.00,
    CURRENT_DATE,
    NULL,
    'Contas da Casa',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
),
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'despesa',
    300.00,
    CURRENT_DATE,
    NULL,
    'Alimentação Familiar',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
);
*/

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Se tudo estiver correto:
-- 1. Deve haver transações da família no mês atual
-- 2. As transações devem ter family_id preenchido
-- 3. Os logs no console devem mostrar dados carregados
-- 4. Os cards devem mostrar valores diferentes de zero

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Verifique se há transações familiares
-- 3. Se não houver, execute o INSERT comentado acima
-- 4. Teste a aplicação e verifique os logs no console
-- 5. Confirme que os cards mostram dados corretos 