-- Testar a função get_user_family_data
SELECT * FROM get_user_family_data('USER_ID_AQUI');

-- Verificar se a função retorna dados corretos
-- Substituir 'USER_ID_AQUI' pelo ID real do utilizador

-- Verificar famílias existentes
SELECT 
    f.id,
    f.nome,
    f.created_by,
    COUNT(fm.id) as total_membros
FROM families f
LEFT JOIN family_members fm ON f.id = fm.family_id
GROUP BY f.id, f.nome, f.created_by;

-- Verificar membros das famílias
SELECT 
    fm.family_id,
    f.nome as nome_familia,
    fm.user_id,
    fm.role,
    p.nome as nome_utilizador
FROM family_members fm
JOIN families f ON fm.family_id = f.id
LEFT JOIN profiles p ON fm.user_id = p.user_id
ORDER BY f.nome, fm.role; 