-- ==========================================
-- INSERIR DADOS DE TESTE PARA A FAMÍLIA
-- ==========================================

-- Este script insere dados de teste para a família se não houver dados

-- ==========================================
-- ETAPA 1: VERIFICAR SE HÁ DADOS EXISTENTES
-- ==========================================

SELECT 'Verificando dados existentes' as teste;
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9' THEN 1 END) as family_transactions
FROM transactions;

-- ==========================================
-- ETAPA 2: INSERIR TRANSAÇÕES DE TESTE
-- ==========================================

-- Inserir transações de teste para a família
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
    2500.00,
    CURRENT_DATE,
    NULL,
    'Salário Familiar',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
),
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'receita',
    800.00,
    CURRENT_DATE - INTERVAL '5 days',
    NULL,
    'Renda Familiar',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
),
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'despesa',
    1200.00,
    CURRENT_DATE,
    NULL,
    'Contas da Casa',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
),
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'despesa',
    500.00,
    CURRENT_DATE - INTERVAL '3 days',
    NULL,
    'Alimentação Familiar',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
),
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'despesa',
    300.00,
    CURRENT_DATE - INTERVAL '1 day',
    NULL,
    'Transporte Familiar',
    'partilhado',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
);

-- ==========================================
-- ETAPA 3: INSERIR METAS DE TESTE
-- ==========================================

-- Inserir metas de teste para a família
INSERT INTO goals (
    user_id,
    nome,
    valor_objetivo,
    valor_atual,
    prazo,
    family_id,
    ativa
) VALUES 
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'Poupança Familiar',
    10000.00,
    2500.00,
    CURRENT_DATE + INTERVAL '6 months',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9',
    true
),
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'Férias em Família',
    5000.00,
    1200.00,
    CURRENT_DATE + INTERVAL '3 months',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9',
    true
);

-- ==========================================
-- ETAPA 4: VERIFICAR DADOS INSERIDOS
-- ==========================================

-- Verificar transações inseridas
SELECT 'Verificando transações inseridas' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.descricao,
    t.family_id,
    f.nome as family_name
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
WHERE t.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY t.created_at DESC;

-- Verificar metas inseridas
SELECT 'Verificando metas inseridas' as teste;
SELECT 
    g.id,
    g.nome,
    g.valor_objetivo,
    g.valor_atual,
    g.family_id,
    g.ativa,
    f.nome as family_name
FROM goals g
LEFT JOIN families f ON f.id = g.family_id
WHERE g.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY g.created_at DESC;

-- ==========================================
-- ETAPA 5: CALCULAR ESTATÍSTICAS MANUALMENTE
-- ==========================================

-- Calcular estatísticas manualmente para verificar
SELECT 'Estatísticas Calculadas Manualmente' as teste;
WITH family_stats AS (
  SELECT 
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
  FROM transactions
  WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
    AND data >= DATE_TRUNC('month', CURRENT_DATE)
    AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
),
family_goals AS (
  SELECT COUNT(*) as metas_ativas
  FROM goals
  WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
    AND ativa = true
)
SELECT 
  t.total_receitas,
  t.total_despesas,
  (t.total_receitas - t.total_despesas) as poupanca,
  CASE 
    WHEN t.total_receitas > 0 THEN 
      ((t.total_receitas - t.total_despesas) / t.total_receitas) * 100 
    ELSE 0 
  END as taxa_poupanca_percent,
  g.metas_ativas
FROM family_stats t
CROSS JOIN family_goals g;

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Após executar este script:
-- 1. Deve haver 5 transações da família
-- 2. Deve haver 2 metas da família
-- 3. As estatísticas devem ser calculadas corretamente
-- 4. Os cards devem mostrar dados diferentes de zero

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Teste a aplicação na página da família
-- 3. Verifique se os cards mostram dados corretos
-- 4. Verifique os logs no console do navegador
-- 5. Confirme que as estatísticas estão a funcionar 