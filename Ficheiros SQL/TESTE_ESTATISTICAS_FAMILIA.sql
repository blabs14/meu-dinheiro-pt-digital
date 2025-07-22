-- ==========================================
-- TESTE: ESTATÍSTICAS DA FAMÍLIA
-- ==========================================

-- Este script testa se as estatísticas da família estão a ser calculadas corretamente

-- ==========================================
-- ETAPA 1: VERIFICAR DADOS DA FAMÍLIA
-- ==========================================

-- Verificar família "familia matias"
SELECT 'Dados da Família' as teste;
SELECT 
    f.id,
    f.nome,
    f.created_at,
    COUNT(fm.id) as member_count
FROM families f
LEFT JOIN family_members fm ON fm.family_id = f.id
WHERE f.nome = 'familia matias'
GROUP BY f.id, f.nome, f.created_at;

-- ==========================================
-- ETAPA 2: VERIFICAR TRANSAÇÕES DA FAMÍLIA
-- ==========================================

-- Verificar transações da família no mês atual
SELECT 'Transações da Família - Mês Atual' as teste;
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
-- ETAPA 3: CALCULAR ESTATÍSTICAS MANUALMENTE
-- ==========================================

-- Calcular receitas da família no mês atual
SELECT 'Receitas da Família - Mês Atual' as teste;
SELECT 
    'Receitas' as tipo,
    COUNT(*) as count,
    SUM(valor) as total_valor
FROM transactions
WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
  AND tipo = 'receita'
  AND data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- Calcular despesas da família no mês atual
SELECT 'Despesas da Família - Mês Atual' as teste;
SELECT 
    'Despesas' as tipo,
    COUNT(*) as count,
    SUM(valor) as total_valor
FROM transactions
WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
  AND tipo = 'despesa'
  AND data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ==========================================
-- ETAPA 4: CALCULAR TAXA DE POUPANÇA
-- ==========================================

-- Calcular taxa de poupança da família
SELECT 'Taxa de Poupança da Família' as teste;
WITH family_stats AS (
  SELECT 
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
  FROM transactions
  WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
    AND data >= DATE_TRUNC('month', CURRENT_DATE)
    AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
)
SELECT 
  total_receitas,
  total_despesas,
  (total_receitas - total_despesas) as poupanca,
  CASE 
    WHEN total_receitas > 0 THEN 
      ((total_receitas - total_despesas) / total_receitas) * 100 
    ELSE 0 
  END as taxa_poupanca_percent
FROM family_stats;

-- ==========================================
-- ETAPA 5: VERIFICAR METAS DA FAMÍLIA
-- ==========================================

-- Verificar metas ativas da família
SELECT 'Metas Ativas da Família' as teste;
SELECT 
    g.id,
    g.nome,
    g.valor_objetivo,
    g.valor_atual,
    g.ativa,
    g.family_id,
    f.nome as family_name
FROM goals g
LEFT JOIN families f ON f.id = g.family_id
WHERE g.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
  AND g.ativa = true
ORDER BY g.created_at DESC;

-- Contar metas ativas
SELECT 'Contagem de Metas Ativas' as teste;
SELECT 
    COUNT(*) as metas_ativas_count
FROM goals
WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
  AND ativa = true;

-- ==========================================
-- ETAPA 6: VERIFICAR MEMBROS DA FAMÍLIA
-- ==========================================

-- Verificar membros da família
SELECT 'Membros da Família' as teste;
SELECT 
    fm.id,
    fm.role,
    fm.created_at,
    p.nome as profile_nome,
    p.email as profile_email
FROM family_members fm
LEFT JOIN profiles p ON p.id = fm.user_id
WHERE fm.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY fm.created_at;

-- Contar membros
SELECT 'Contagem de Membros' as teste;
SELECT 
    COUNT(*) as member_count
FROM family_members
WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9';

-- ==========================================
-- ETAPA 7: SIMULAR CÁLCULO COMPLETO
-- ==========================================

-- Simular o cálculo completo das estatísticas
SELECT 'Simulação Completa das Estatísticas' as teste;
WITH family_transactions AS (
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
),
family_members AS (
  SELECT COUNT(*) as member_count
  FROM family_members
  WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
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
  g.metas_ativas,
  m.member_count
FROM family_transactions t
CROSS JOIN family_goals g
CROSS JOIN family_members m;

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Se tudo estiver correto:
-- 1. Deve haver transações da família no mês atual
-- 2. As estatísticas devem ser calculadas corretamente
-- 3. Os cards devem mostrar valores diferentes de zero
-- 4. A taxa de poupança deve ser calculada corretamente
-- 5. O número de metas ativas deve ser correto

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Verifique se há dados para calcular as estatísticas
-- 3. Teste a aplicação - os cards devem mostrar dados corretos
-- 4. Confirme que as estatísticas estão a ser atualizadas 