-- TESTE SAIR DA FAMÍLIA
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR MEMBROS ATUAIS
SELECT 
    '=== MEMBROS ATUAIS ===' as info;
SELECT 
    fm.id,
    fm.user_id,
    fm.role,
    p.nome,
    f.nome as family_name
FROM family_members fm
JOIN families f ON fm.family_id = f.id
LEFT JOIN profiles p ON fm.user_id = p.id
WHERE fm.family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
)
ORDER BY 
    CASE fm.role 
        WHEN 'owner' THEN 1 
        WHEN 'admin' THEN 2 
        WHEN 'member' THEN 3 
        WHEN 'viewer' THEN 4 
    END;

-- 2. VERIFICAR MEU ROLE ATUAL
SELECT 
    '=== MEU ROLE ATUAL ===' as info;
SELECT 
    fm.role,
    f.nome as family_name,
    CASE 
        WHEN fm.role = 'owner' THEN 'Pode transferir ownership ou eliminar família'
        WHEN fm.role IN ('admin', 'member', 'viewer') THEN 'Pode sair da família'
    END as can_leave
FROM family_members fm
JOIN families f ON fm.family_id = f.id
WHERE fm.user_id = auth.uid();

-- 3. SIMULAR SAIR DA FAMÍLIA (APENAS VERIFICAÇÃO)
SELECT 
    '=== SIMULAÇÃO SAIR FAMÍLIA ===' as info;
SELECT 
    'Se sair da família, perderá acesso a:' as info,
    COUNT(*) as total_transactions,
    'transações familiares' as tipo
FROM transactions 
WHERE family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
)
UNION ALL
SELECT 
    'E também perderá acesso a:' as info,
    COUNT(*) as total_goals,
    'metas familiares' as tipo
FROM goals 
WHERE family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
);

-- 4. VERIFICAR SE HÁ OUTROS MEMBROS (PARA OWNER)
SELECT 
    '=== OUTROS MEMBROS (PARA OWNER) ===' as info;
SELECT 
    COUNT(*) as total_other_members,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Único membro - pode eliminar família'
        ELSE 'Há outros membros - deve transferir ownership'
    END as recommendation
FROM family_members fm
WHERE fm.family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
)
AND fm.user_id != auth.uid(); 