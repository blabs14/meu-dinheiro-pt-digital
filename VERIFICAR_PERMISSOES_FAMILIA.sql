-- VERIFICAR PERMISSÕES E MEMBROS DA FAMÍLIA
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. VERIFICAR MEMBROS DA FAMÍLIA
SELECT 
    '=== MEMBROS DA FAMÍLIA ===' as info;
SELECT 
    fm.id,
    fm.user_id,
    fm.role,
    fm.joined_at,
    p.nome,
    p.email
FROM family_members fm
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
    END,
    fm.joined_at;

-- 2. VERIFICAR PERMISSÕES DO UTILIZADOR ATUAL
SELECT 
    '=== MINHAS PERMISSÕES ===' as info;
SELECT 
    fm.role,
    fm.joined_at,
    f.nome as family_name,
    f.created_by,
    CASE 
        WHEN fm.role = 'owner' THEN 'Pode fazer tudo'
        WHEN fm.role = 'admin' THEN 'Pode gerir membros e convites'
        WHEN fm.role = 'member' THEN 'Pode adicionar transações'
        WHEN fm.role = 'viewer' THEN 'Apenas visualizar'
    END as permissions
FROM family_members fm
JOIN families f ON fm.family_id = f.id
WHERE fm.user_id = auth.uid();

-- 3. VERIFICAR CONVITES PENDENTES
SELECT 
    '=== CONVITES PENDENTES ===' as info;
SELECT 
    fi.id,
    fi.email,
    fi.role,
    fi.status,
    fi.created_at,
    fi.expires_at,
    f.nome as family_name
FROM family_invites fi
JOIN families f ON fi.family_id = f.id
WHERE fi.email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
)
AND fi.status = 'pending'
ORDER BY fi.created_at DESC;

-- 4. VERIFICAR SE POSSO REMOVER MEMBROS
SELECT 
    '=== PERMISSÕES DE REMOÇÃO ===' as info;
SELECT 
    fm.role as my_role,
    CASE 
        WHEN fm.role IN ('owner', 'admin') THEN 'Pode remover membros'
        ELSE 'Não pode remover membros'
    END as can_remove_members,
    CASE 
        WHEN fm.role = 'owner' THEN 'Pode transferir ownership'
        ELSE 'Não pode transferir ownership'
    END as can_transfer_ownership
FROM family_members fm
WHERE fm.user_id = auth.uid()
AND fm.family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
); 