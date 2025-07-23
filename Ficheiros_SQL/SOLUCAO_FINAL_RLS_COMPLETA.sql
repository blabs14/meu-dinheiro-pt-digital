-- ==========================================
-- SOLUÇÃO FINAL RLS COMPLETA
-- Execute este SQL completo de uma vez
-- ==========================================

-- Esta solução limpa tudo e implementa RLS corretamente
-- sem recursão e sem conflitos

-- ==========================================
-- ETAPA 1: LIMPEZA COMPLETA
-- ==========================================

-- 1.1 Desativar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites DISABLE ROW LEVEL SECURITY;

-- 1.2 Remover TODAS as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                          'fixed_expenses', 'families', 'family_members', 'family_invites')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 1.3 Remover função existente (todas as versões)
DROP FUNCTION IF EXISTS get_user_families(UUID);
DROP FUNCTION IF EXISTS get_user_families(p_user_id UUID);

-- ==========================================
-- ETAPA 2: CRIAR FUNÇÃO AUXILIAR CORRETA
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_families(user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT family_id FROM (
        -- Famílias onde o utilizador é criador
        SELECT f.id as family_id
        FROM families f
        WHERE f.created_by = $1
        
        UNION
        
        -- Famílias onde o utilizador é membro
        SELECT fm.family_id
        FROM family_members fm
        WHERE fm.user_id = $1
    ) AS all_families;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- ETAPA 3: ATIVAR RLS E CRIAR POLÍTICAS
-- ==========================================

-- 3.1 PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_access" ON profiles
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3.2 CATEGORIES (público)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON categories
    FOR SELECT 
    USING (true);

-- 3.3 TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Transações próprias (pessoais e familiares criadas pelo utilizador)
CREATE POLICY "transactions_own" ON transactions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Transações familiares de outros membros (apenas leitura)
CREATE POLICY "transactions_family_read" ON transactions
    FOR SELECT
    USING (
        family_id IS NOT NULL 
        AND family_id IN (SELECT get_user_families(auth.uid()))
        AND user_id != auth.uid()  -- Evita duplicação com política anterior
    );

-- 3.4 GOALS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Metas próprias
CREATE POLICY "goals_own" ON goals
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Metas familiares de outros membros (apenas leitura)
CREATE POLICY "goals_family_read" ON goals
    FOR SELECT
    USING (
        family_id IS NOT NULL 
        AND family_id IN (SELECT get_user_families(auth.uid()))
        AND user_id != auth.uid()
    );

-- 3.5 FIXED_EXPENSES
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixed_expenses_own" ON fixed_expenses
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3.6 FAMILIES
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Ver famílias onde é membro ou criador
CREATE POLICY "families_member_access" ON families
    FOR SELECT
    USING (id IN (SELECT get_user_families(auth.uid())));

-- Criar famílias
CREATE POLICY "families_create" ON families
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Atualizar apenas se for criador
CREATE POLICY "families_update" ON families
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Eliminar apenas se for criador
CREATE POLICY "families_delete" ON families
    FOR DELETE
    USING (auth.uid() = created_by);

-- 3.7 FAMILY_MEMBERS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Ver membros das suas famílias
CREATE POLICY "family_members_view" ON family_members
    FOR SELECT
    USING (family_id IN (SELECT get_user_families(auth.uid())));

-- Apenas criadores podem adicionar membros
CREATE POLICY "family_members_insert" ON family_members
    FOR INSERT
    WITH CHECK (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

-- Apenas criadores podem atualizar
CREATE POLICY "family_members_update" ON family_members
    FOR UPDATE
    USING (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

-- Criadores podem remover qualquer membro, membros podem sair
CREATE POLICY "family_members_delete" ON family_members
    FOR DELETE
    USING (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
        OR auth.uid() = user_id
    );

-- 3.8 FAMILY_INVITES
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- Ver convites das suas famílias ou para o seu email
CREATE POLICY "family_invites_view" ON family_invites
    FOR SELECT
    USING (
        family_id IN (SELECT get_user_families(auth.uid()))
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Apenas criadores podem criar convites
CREATE POLICY "family_invites_create" ON family_invites
    FOR INSERT
    WITH CHECK (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

-- Criadores podem atualizar seus convites
CREATE POLICY "family_invites_update_creator" ON family_invites
    FOR UPDATE
    USING (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

-- Convidados podem atualizar status do convite
CREATE POLICY "family_invites_update_invitee" ON family_invites
    FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
    )
    WITH CHECK (status IN ('accepted', 'declined'));

-- Apenas criadores podem eliminar convites
CREATE POLICY "family_invites_delete" ON family_invites
    FOR DELETE
    USING (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

-- ==========================================
-- ETAPA 4: VERIFICAÇÃO FINAL
-- ==========================================

-- 4.1 Verificar estado de RLS
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
ORDER BY tablename;

-- 4.2 Contar políticas por tabela
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
GROUP BY tablename
ORDER BY tablename;

-- 4.3 Testar função (pode retornar vazio no SQL Editor)
SELECT * FROM get_user_families(auth.uid());

-- ==========================================
-- SUCESSO!
-- ==========================================

-- Se chegou aqui sem erros:
-- 1. RLS está ativo em todas as tabelas
-- 2. Políticas estão configuradas corretamente
-- 3. Sem recursão infinita
-- 4. Sistema de famílias funcional

-- Volte à aplicação e teste:
-- - Dashboard deve carregar
-- - Transações devem aparecer
-- - Metas devem funcionar
-- - Sistema familiar operacional 