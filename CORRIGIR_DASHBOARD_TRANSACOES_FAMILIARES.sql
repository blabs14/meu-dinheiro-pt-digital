-- ==========================================
-- CORREÇÃO: DASHBOARD INCLUIR TRANSAÇÕES FAMILIARES
-- ==========================================

-- PROBLEMA IDENTIFICADO:
-- O dashboard está a buscar apenas transações pessoais (user_id + family_id IS NULL)
-- Mas as políticas RLS permitem acesso a transações familiares
-- Precisamos corrigir as queries para incluir transações familiares

-- ==========================================
-- SOLUÇÃO: FUNÇÃO AUXILIAR PARA DASHBOARD
-- ==========================================

-- Criar função para obter todas as transações do utilizador (pessoais + familiares)
CREATE OR REPLACE FUNCTION get_user_all_transactions(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    valor DECIMAL,
    tipo TEXT,
    data DATE,
    descricao TEXT,
    modo TEXT,
    user_id UUID,
    family_id UUID,
    categoria_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.valor,
        t.tipo,
        t.data,
        t.descricao,
        t.modo,
        t.user_id,
        t.family_id,
        t.categoria_id
    FROM transactions t
    WHERE (
        -- Transações pessoais do utilizador
        (t.user_id = p_user_id AND t.family_id IS NULL)
        OR
        -- Transações familiares onde o utilizador é membro
        (t.family_id IS NOT NULL AND t.family_id IN (
            SELECT get_user_families(p_user_id)
        ))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- VERIFICAÇÃO DA FUNÇÃO
-- ==========================================

-- Testar a função (substitua pelo seu user_id real)
-- SELECT * FROM get_user_all_transactions('SEU_USER_ID_AQUI');

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute esta função no SQL Editor
-- 2. Depois vou corrigir o código TypeScript do dashboard
-- 3. Teste novamente a aplicação

-- A função retorna:
-- - Transações pessoais (user_id = auth.uid() AND family_id IS NULL)
-- - Transações familiares (family_id IN get_user_families(auth.uid()))

-- Isto resolve o problema de não ver transações familiares no dashboard 