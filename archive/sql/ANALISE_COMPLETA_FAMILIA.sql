-- ==========================================
-- ANÁLISE COMPLETA: PROBLEMA ESTATÍSTICAS FAMÍLIA
-- ==========================================

-- Este script faz uma análise completa para diagnosticar o problema

-- ==========================================
-- ETAPA 1: VERIFICAR DADOS EXISTENTES
-- ==========================================

-- Verificar todas as famílias
SELECT 'Todas as Famílias' as teste;
SELECT 
    f.id,
    f.nome,
    f.created_at,
    COUNT(fm.id) as member_count
FROM families f
LEFT JOIN family_members fm ON fm.family_id = f.id
GROUP BY f.id, f.nome, f.created_at
ORDER BY f.created_at DESC;

-- ==========================================
-- ETAPA 2: VERIFICAR TRANSAÇÕES POR FAMÍLIA
-- ==========================================

-- Verificar transações por família
SELECT 'Transações por Família' as teste;
SELECT 
    f.nome as family_name,
    f.id as family_id,
    COUNT(t.id) as total_transactions,
    COUNT(CASE WHEN t.tipo = 'receita' THEN 1 END) as receitas,
    COUNT(CASE WHEN t.tipo = 'despesa' THEN 1 END) as despesas,
    SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END) as total_despesas
FROM families f
LEFT JOIN transactions t ON t.family_id = f.id
GROUP BY f.id, f.nome
ORDER BY total_transactions DESC;

-- ==========================================
-- ETAPA 3: VERIFICAR TRANSAÇÕES DO MÊS ATUAL
-- ==========================================

-- Verificar transações do mês atual por família
SELECT 'Transações do Mês Atual por Família' as teste;
SELECT 
    f.nome as family_name,
    f.id as family_id,
    COUNT(t.id) as transactions_this_month,
    SUM(CASE WHEN t.tipo = 'receita' THEN t.valor ELSE 0 END) as receitas_mes,
    SUM(CASE WHEN t.tipo = 'despesa' THEN t.valor ELSE 0 END) as despesas_mes
FROM families f
LEFT JOIN transactions t ON t.family_id = f.id
    AND t.data >= DATE_TRUNC('month', CURRENT_DATE)
    AND t.data < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY f.id, f.nome
ORDER BY transactions_this_month DESC;

-- ==========================================
-- ETAPA 4: VERIFICAR FAMÍLIA ESPECÍFICA
-- ==========================================

-- Verificar família "familia matias" especificamente
SELECT 'Análise da Família "familia matias"' as teste;
SELECT 
    f.id,
    f.nome,
    f.created_at,
    COUNT(fm.id) as member_count,
    COUNT(t.id) as total_transactions,
    COUNT(CASE WHEN t.data >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as transactions_this_month
FROM families f
LEFT JOIN family_members fm ON fm.family_id = f.id
LEFT JOIN transactions t ON t.family_id = f.id
WHERE f.nome = 'familia matias'
GROUP BY f.id, f.nome, f.created_at;

-- ==========================================
-- ETAPA 5: VERIFICAR TRANSAÇÕES DA FAMÍLIA ESPECÍFICA
-- ==========================================

-- Verificar todas as transações da família específica
SELECT 'Todas as Transações da Família Específica' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.data,
    t.family_id,
    t.user_id,
    t.modo,
    f.nome as family_name,
    u.email as user_email
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
LEFT JOIN auth.users u ON u.id = t.user_id
WHERE t.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY t.created_at DESC;

-- ==========================================
-- ETAPA 6: VERIFICAR SE HÁ DADOS DE TESTE
-- ==========================================

-- Verificar se há transações de teste
SELECT 'Verificar Transações de Teste' as teste;
SELECT 
    COUNT(*) as total_test_transactions,
    COUNT(CASE WHEN descricao LIKE '%Familiar%' OR descricao LIKE '%Casa%' THEN 1 END) as family_test_transactions
FROM transactions
WHERE family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9';

-- ==========================================
-- ETAPA 7: CRIAR DADOS DE TESTE SE NECESSÁRIO
-- ==========================================

-- Se não houver transações familiares, criar dados de teste
-- (Execute apenas se não houver dados)

/*
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
*/

-- ==========================================
-- ETAPA 8: VERIFICAR METAS DA FAMÍLIA
-- ==========================================

-- Verificar metas da família
SELECT 'Metas da Família' as teste;
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
ORDER BY g.created_at DESC;

-- ==========================================
-- ETAPA 9: VERIFICAR MEMBROS DA FAMÍLIA
-- ==========================================

-- Verificar membros da família
SELECT 'Membros da Família' as teste;
SELECT 
    fm.id,
    fm.role,
    fm.created_at,
    p.nome as profile_nome,
    p.email as profile_email,
    u.email as auth_email
FROM family_members fm
LEFT JOIN profiles p ON p.id = fm.user_id
LEFT JOIN auth.users u ON u.id = fm.user_id
WHERE fm.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY fm.created_at;

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Se tudo estiver correto:
-- 1. Deve haver transações da família no mês atual
-- 2. As transações devem ter family_id preenchido
-- 3. Deve haver metas da família
-- 4. Deve haver membros da família
-- 5. Os cards devem mostrar dados corretos

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Verifique se há dados para a família
-- 3. Se não houver, execute o INSERT comentado acima
-- 4. Teste a aplicação novamente
-- 5. Verifique os logs no console 