-- ==========================================
-- TESTE: TRANSAÇÕES FAMILIARES - VERIFICAÇÃO
-- ==========================================

-- Este script testa se o filtro de transações familiares está a funcionar corretamente

-- ==========================================
-- ETAPA 1: VERIFICAR DADOS EXISTENTES
-- ==========================================

-- Contar transações por tipo
SELECT 'Contagem de Transações' as teste;
SELECT 
    'Total' as tipo,
    COUNT(*) as count
FROM transactions
UNION ALL
SELECT 
    'Pessoais' as tipo,
    COUNT(*) as count
FROM transactions
WHERE family_id IS NULL
UNION ALL
SELECT 
    'Familiares' as tipo,
    COUNT(*) as count
FROM transactions
WHERE family_id IS NOT NULL;

-- ==========================================
-- ETAPA 2: VERIFICAR TRANSAÇÕES FAMILIARES ESPECÍFICAS
-- ==========================================

-- Verificar transações da família "familia matias"
SELECT 'Transações da Família "familia matias"' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id,
    f.nome as family_name,
    u.email as created_by_email
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
LEFT JOIN auth.users u ON u.id = t.user_id
WHERE t.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY t.created_at DESC
LIMIT 10;

-- ==========================================
-- ETAPA 3: SIMULAR FILTRO DO COMPONENTE
-- ==========================================

-- Simular o que o RecentTransactions deve fazer quando familyId é fornecido
SELECT 'Simulação do RecentTransactions com familyId' as teste;
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
ORDER BY t.data DESC
LIMIT 10;

-- ==========================================
-- ETAPA 4: VERIFICAR OUTRAS FAMÍLIAS
-- ==========================================

-- Verificar se há transações na outra família
SELECT 'Verificar outras famílias' as teste;
SELECT 
    f.id as family_id,
    f.nome as family_name,
    COUNT(t.id) as transactions_count
FROM families f
LEFT JOIN transactions t ON t.family_id = f.id
GROUP BY f.id, f.nome
ORDER BY f.nome;

-- ==========================================
-- ETAPA 5: VERIFICAR TRANSAÇÕES DO MÊS ATUAL
-- ==========================================

-- Verificar transações do mês atual (para dashboard)
SELECT 'Transações do Mês Atual' as teste;
SELECT 
    'Total' as tipo,
    COUNT(*) as count,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
FROM transactions
WHERE data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
UNION ALL
SELECT 
    'Pessoais' as tipo,
    COUNT(*) as count,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
FROM transactions
WHERE data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND family_id IS NULL
UNION ALL
SELECT 
    'Familiares' as tipo,
    COUNT(*) as count,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
FROM transactions
WHERE data >= DATE_TRUNC('month', CURRENT_DATE)
  AND data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND family_id IS NOT NULL;

-- ==========================================
-- ETAPA 6: SIMULAR ACESSO DE UTILIZADOR
-- ==========================================

-- Simular acesso às transações (sem autenticação real)
SELECT 'Simulação de acesso às transações' as teste;
SELECT 
    'Transações do User 1' as user,
    COUNT(*) as total_transactions
FROM transactions t
WHERE (
    t.user_id = '9a04bd6f-beae-4ac8-9a99-dff911004e1a' 
    OR t.family_id IN (SELECT get_user_families('9a04bd6f-beae-4ac8-9a99-dff911004e1a'))
)
UNION ALL
SELECT 
    'Transações do User 2' as user,
    COUNT(*) as total_transactions
FROM transactions t
WHERE (
    t.user_id = '3007cf41-5693-4bbd-a44c-047a80a10595' 
    OR t.family_id IN (SELECT get_user_families('3007cf41-5693-4bbd-a44c-047a80a10595'))
)
UNION ALL
SELECT 
    'Transações do User 3' as user,
    COUNT(*) as total_transactions
FROM transactions t
WHERE (
    t.user_id = '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6' 
    OR t.family_id IN (SELECT get_user_families('017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6'))
);

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Se tudo estiver correto:
-- 1. Deve haver transações familiares na família "familia matias"
-- 2. O RecentTransactions deve mostrar apenas transações da família quando familyId é fornecido
-- 3. Os gráficos devem mostrar dados corretos
-- 4. O dashboard deve incluir transações familiares nos totais

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Verifique os resultados
-- 3. Teste a aplicação no dashboard e página família
-- 4. Confirme que as transações familiares aparecem corretamente 