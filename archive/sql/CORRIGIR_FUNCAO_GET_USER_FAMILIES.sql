-- ==========================================
-- CORRIGIR ERRO: "user_id is ambiguous"
-- ==========================================

-- O erro acontece porque a função tem referência ambígua
-- Vamos corrigir especificando as tabelas corretamente

-- ==========================================
-- PASSO 1: REMOVER FUNÇÃO COM ERRO
-- ==========================================

DROP FUNCTION IF EXISTS get_user_families(UUID);

-- ==========================================
-- PASSO 2: CRIAR FUNÇÃO CORRIGIDA
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_families(p_user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT family_id FROM (
        -- Famílias onde o utilizador é criador
        SELECT f.id as family_id
        FROM families f
        WHERE f.created_by = p_user_id
        
        UNION
        
        -- Famílias onde o utilizador é membro
        SELECT fm.family_id
        FROM family_members fm
        WHERE fm.user_id = p_user_id
    ) AS user_families;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- PASSO 3: TESTAR A FUNÇÃO
-- ==========================================

-- Teste com um user_id específico (substitua pelo seu)
-- SELECT * FROM get_user_families('017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6');

-- Teste com o utilizador atual (pode retornar NULL no SQL Editor)
SELECT * FROM get_user_families(auth.uid());

-- ==========================================
-- PASSO 4: SE A FUNÇÃO FUNCIONAR, CONTINUE
-- ==========================================

-- Agora execute novamente a partir do PASSO 3 do arquivo
-- SOLUCAO_RLS_INDEPENDENTE.sql (políticas)

-- ==========================================
-- ALTERNATIVA: FUNÇÃO AINDA MAIS SIMPLES
-- ==========================================

-- Se ainda houver problemas, use esta versão:
/*
DROP FUNCTION IF EXISTS get_user_families(UUID);

CREATE OR REPLACE FUNCTION get_user_families(p_user_id UUID)
RETURNS TABLE(family_id UUID) AS $$
BEGIN
    -- Famílias criadas pelo utilizador
    RETURN QUERY
    SELECT id FROM families WHERE created_by = p_user_id;
    
    -- Famílias onde é membro
    RETURN QUERY
    SELECT fm.family_id 
    FROM family_members fm 
    WHERE fm.user_id = p_user_id
    AND fm.family_id NOT IN (
        SELECT id FROM families WHERE created_by = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
*/

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

-- Verificar se a função foi criada
SELECT 
    proname as function_name,
    prorettype::regtype as return_type,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'get_user_families';

-- ==========================================
-- IMPORTANTE
-- ==========================================

-- Após corrigir a função, volte ao arquivo
-- SOLUCAO_RLS_INDEPENDENTE.sql e execute
-- a partir do PASSO 3 (políticas) 