-- TESTE SAIR DA FAMÍLIA (CORRIGIDO)
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR MEMBROS ATUAIS
SELECT 
    '=== MEMBROS ATUAIS ===' as info;
SELECT 
    fm.id,
    fm.user_id,
    fm.role,
    p.nome,
    f.nome as family_name,
    fm.joined_at
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

-- 3. VERIFICAR DADOS FAMILIARES QUE PERDERÁ
SELECT 
    '=== DADOS QUE PERDERÁ ===' as info;
SELECT 
    'Transações familiares' as tipo,
    COUNT(*) as quantidade
FROM transactions 
WHERE family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
)
UNION ALL
SELECT 
    'Metas familiares' as tipo,
    COUNT(*) as quantidade
FROM goals 
WHERE family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
);

-- 4. VERIFICAR OUTROS MEMBROS (PARA OWNER)
SELECT 
    '=== OUTROS MEMBROS ===' as info;
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

-- 5. VERIFICAR CONVITES PENDENTES
SELECT 
    '=== CONVITES PENDENTES ===' as info;
SELECT 
    fi.id,
    fi.email,
    fi.role,
    fi.status,
    f.nome as family_name
FROM family_invites fi
JOIN families f ON fi.family_id = f.id
WHERE fi.family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
)
AND fi.status = 'pending'; 