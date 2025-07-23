-- ==========================================
-- TESTE: METAS FAMILIARES - VERIFICAÇÃO
-- ==========================================

-- Este script testa se o filtro de metas familiares está a funcionar corretamente

-- ==========================================
-- ETAPA 1: VERIFICAR DADOS EXISTENTES
-- ==========================================

-- Contar metas por tipo
SELECT 'Contagem de Metas' as teste;
SELECT 
    'Total' as tipo,
    COUNT(*) as count
FROM goals
UNION ALL
SELECT 
    'Pessoais' as tipo,
    COUNT(*) as count
FROM goals
WHERE family_id IS NULL
UNION ALL
SELECT 
    'Familiares' as tipo,
    COUNT(*) as count
FROM goals
WHERE family_id IS NOT NULL;

-- ==========================================
-- ETAPA 2: VERIFICAR METAS FAMILIARES ESPECÍFICAS
-- ==========================================

-- Verificar metas da família "familia matias"
SELECT 'Metas da Família "familia matias"' as teste;
SELECT 
    g.id,
    g.nome,
    g.valor_meta,
    g.valor_atual,
    g.family_id,
    f.nome as family_name,
    u.email as created_by_email
FROM goals g
LEFT JOIN families f ON f.id = g.family_id
LEFT JOIN auth.users u ON u.id = g.user_id
WHERE g.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY g.created_at DESC;

-- ==========================================
-- ETAPA 3: SIMULAR FILTRO DO COMPONENTE
-- ==========================================

-- Simular o que o GoalsManager deve fazer quando familyId é fornecido
SELECT 'Simulação do GoalsManager com familyId' as teste;
SELECT 
    g.id,
    g.nome,
    g.valor_meta,
    g.valor_atual,
    g.family_id,
    f.nome as family_name
FROM goals g
LEFT JOIN families f ON f.id = g.family_id
WHERE g.family_id = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
ORDER BY g.created_at DESC;

-- ==========================================
-- ETAPA 4: VERIFICAR OUTRAS FAMÍLIAS
-- ==========================================

-- Verificar se há metas na outra família
SELECT 'Verificar outras famílias' as teste;
SELECT 
    f.id as family_id,
    f.nome as family_name,
    COUNT(g.id) as goals_count
FROM families f
LEFT JOIN goals g ON g.family_id = f.id
GROUP BY f.id, f.nome
ORDER BY f.nome;

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Se tudo estiver correto:
-- 1. Deve haver 1 meta familiar na família "familia matias"
-- 2. O GoalsManager deve mostrar apenas essa meta quando familyId = '440b2a36-ca1d-406f-8bbe-8b979d3614f9'
-- 3. Na página família, deve aparecer apenas "Meta Familiar Teste"
-- 4. Na página geral de metas, deve aparecer todas as metas (pessoais + familiares)

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Verifique os resultados
-- 3. Teste a aplicação na página família
-- 4. Confirme que apenas a meta familiar aparece 