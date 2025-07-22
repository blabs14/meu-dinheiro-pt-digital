-- ==========================================
-- TESTE FINAL RLS - VERIFICAÇÃO COMPLETA
-- ==========================================

-- Este script testa se as políticas RLS estão a funcionar corretamente
-- e se as transações e metas familiares aparecem no dashboard

-- ==========================================
-- ETAPA 1: VERIFICAR FUNÇÃO AUXILIAR
-- ==========================================

-- Testar função get_user_families
SELECT 'Teste 1: Função get_user_families' as teste;
SELECT get_user_families('9a04bd6f-beae-4ac8-9a99-dff911004e1a') as family_ids_user1;
SELECT get_user_families('3007cf41-5693-4bbd-a44c-047a80a10595') as family_ids_user2;
SELECT get_user_families('017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6') as family_ids_user3;

-- ==========================================
-- ETAPA 2: VERIFICAR POLÍTICAS RLS
-- ==========================================

-- Verificar políticas atuais
SELECT 'Teste 2: Políticas RLS atuais' as teste;
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('transactions', 'goals', 'families', 'family_members')
ORDER BY tablename, policyname;

-- ==========================================
-- ETAPA 3: VERIFICAR DADOS DISPONÍVEIS
-- ==========================================

-- Contar transações por tipo
SELECT 'Teste 3: Contagem de transações' as teste;
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

-- Contar metas por tipo
SELECT 'Teste 4: Contagem de metas' as teste;
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
-- ETAPA 4: SIMULAR ACESSO DE UTILIZADOR
-- ==========================================

-- Simular acesso às transações (sem autenticação real)
SELECT 'Teste 5: Simulação de acesso às transações' as teste;
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

-- Simular acesso às metas
SELECT 'Teste 6: Simulação de acesso às metas' as teste;
SELECT 
    'Metas do User 1' as user,
    COUNT(*) as total_goals
FROM goals g
WHERE (
    g.user_id = '9a04bd6f-beae-4ac8-9a99-dff911004e1a' 
    OR g.family_id IN (SELECT get_user_families('9a04bd6f-beae-4ac8-9a99-dff911004e1a'))
)
UNION ALL
SELECT 
    'Metas do User 2' as user,
    COUNT(*) as total_goals
FROM goals g
WHERE (
    g.user_id = '3007cf41-5693-4bbd-a44c-047a80a10595' 
    OR g.family_id IN (SELECT get_user_families('3007cf41-5693-4bbd-a44c-047a80a10595'))
)
UNION ALL
SELECT 
    'Metas do User 3' as user,
    COUNT(*) as total_goals
FROM goals g
WHERE (
    g.user_id = '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6' 
    OR g.family_id IN (SELECT get_user_families('017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6'))
);

-- ==========================================
-- ETAPA 5: VERIFICAR DADOS ESPECÍFICOS
-- ==========================================

-- Verificar transações familiares específicas
SELECT 'Teste 7: Transações familiares detalhadas' as teste;
SELECT 
    t.id,
    t.valor,
    t.tipo,
    t.family_id,
    f.nome as family_name,
    u.email as created_by_email
FROM transactions t
LEFT JOIN families f ON f.id = t.family_id
LEFT JOIN auth.users u ON u.id = t.user_id
WHERE t.family_id IS NOT NULL
ORDER BY t.created_at DESC
LIMIT 5;

-- Verificar metas familiares específicas
SELECT 'Teste 8: Metas familiares detalhadas' as teste;
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
WHERE g.family_id IS NOT NULL
ORDER BY g.created_at DESC;

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Se tudo estiver correto:
-- 1. Função get_user_families retorna family_ids corretos
-- 2. Políticas RLS estão ativas
-- 3. Transações familiares aparecem para membros da família
-- 4. Metas familiares aparecem para membros da família
-- 5. Dashboard deve mostrar dados corretos

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Verifique os resultados
-- 3. Se tudo estiver OK, teste a aplicação
-- 4. Se houver problemas, analise os resultados 