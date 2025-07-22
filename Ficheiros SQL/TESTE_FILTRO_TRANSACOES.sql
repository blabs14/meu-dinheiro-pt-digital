-- ==========================================
-- TESTE: FILTRO DE TRANSAÇÕES PESSOAIS vs FAMILIARES
-- ==========================================

-- Este script testa se o filtro entre transações pessoais e familiares está a funcionar

-- ==========================================
-- ETAPA 1: VERIFICAR DADOS EXISTENTES
-- ==========================================

-- Contar transações por tipo de família
SELECT 'Contagem de Transações por Tipo' as teste;
SELECT 
    'Total' as tipo,
    COUNT(*) as count
FROM transactions
UNION ALL
SELECT 
    'Pessoais (family_id IS NULL)' as tipo,
    COUNT(*) as count
FROM transactions
WHERE family_id IS NULL
UNION ALL
SELECT 
    'Familiares (family_id NOT NULL)' as tipo,
    COUNT(*) as count
FROM transactions
WHERE family_id IS NOT NULL;

-- ==========================================
-- ETAPA 2: VERIFICAR TRANSAÇÕES PESSOAIS
-- ==========================================

-- Verificar transações pessoais (devem aparecer apenas no dashboard geral)
SELECT 'Transações Pessoais (Dashboard Geral)' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id,
    t.modo,
    u.email as created_by_email
FROM transactions t
LEFT JOIN auth.users u ON u.id = t.user_id
WHERE t.family_id IS NULL
ORDER BY t.created_at DESC
LIMIT 10;

-- ==========================================
-- ETAPA 3: VERIFICAR TRANSAÇÕES FAMILIARES
-- ==========================================

-- Verificar transações familiares (devem aparecer apenas no dashboard da família)
SELECT 'Transações Familiares (Dashboard Família)' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id,
    t.modo,
    f.nome as family_name,
    u.email as created_by_email
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
LEFT JOIN auth.users u ON u.id = t.user_id
WHERE t.family_id IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 10;

-- ==========================================
-- ETAPA 4: SIMULAR FILTROS DOS COMPONENTES
-- ==========================================

-- Simular RecentTransactions sem familyId (dashboard geral)
SELECT 'Simulação: RecentTransactions sem familyId (Dashboard Geral)' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id
FROM transactions t
WHERE t.family_id IS NULL  -- Apenas transações pessoais
ORDER BY t.data DESC
LIMIT 10;

-- Simular RecentTransactions com familyId (dashboard família)
SELECT 'Simulação: RecentTransactions com familyId (Dashboard Família)' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id,
    f.nome as family_name
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
WHERE t.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'  -- Apenas transações desta família
ORDER BY t.data DESC
LIMIT 10;

-- ==========================================
-- ETAPA 5: VERIFICAR TRANSAÇÕES DO MÊS ATUAL
-- ==========================================

-- Verificar transações pessoais do mês atual
SELECT 'Transações Pessoais do Mês Atual' as teste;
SELECT 
    'Pessoais' as tipo,
    COUNT(*) as count,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
FROM transactions
WHERE data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND family_id IS NULL;

-- Verificar transações familiares do mês atual
SELECT 'Transações Familiares do Mês Atual' as teste;
SELECT 
    f.nome as family_name,
    COUNT(t.id) as count,
    SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END) as total_despesas
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
WHERE t.data >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND t.family_id IS NOT NULL
GROUP BY f.id, f.nome;

-- ==========================================
-- ETAPA 6: VERIFICAR MODOS DE TRANSAÇÃO
-- ==========================================

-- Verificar distribuição de modos
SELECT 'Distribuição de Modos de Transação' as teste;
SELECT 
    modo,
    COUNT(*) as count,
    COUNT(CASE WHEN family_id IS NULL THEN 1 END) as pessoais,
    COUNT(CASE WHEN family_id IS NOT NULL THEN 1 END) as familiares
FROM transactions
GROUP BY modo;

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Se tudo estiver correto:
-- 1. Dashboard Geral deve mostrar apenas transações com family_id IS NULL
-- 2. Dashboard Família deve mostrar apenas transações com family_id = família específica
-- 3. Transações "pessoais" devem ter family_id IS NULL
-- 4. Transações "partilhadas" devem ter family_id NOT NULL
-- 5. Não deve haver sobreposição entre os dois dashboards

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Verifique se há transações pessoais e familiares separadas
-- 3. Teste a aplicação - dashboard geral deve mostrar apenas pessoais
-- 4. Teste a aplicação - dashboard família deve mostrar apenas familiares
-- 5. Confirme que não há sobreposição 