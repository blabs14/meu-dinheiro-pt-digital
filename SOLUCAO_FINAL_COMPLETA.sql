-- ==========================================
-- SOLUÇÃO FINAL COMPLETA - LIMPAR TUDO E RECRIAR
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- ==========================================
-- ETAPA 1: REMOÇÃO AGRESSIVA DE TODAS AS POLÍTICAS
-- ==========================================

-- Desativar RLS temporariamente para fazer limpeza completa
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas das tabelas families
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'families'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON families';
    END LOOP;
END $$;

-- Remover TODAS as políticas das tabelas family_members
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'family_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON family_members';
    END LOOP;
END $$;

-- Remover TODAS as políticas das tabelas family_invites
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'family_invites'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON family_invites';
    END LOOP;
END $$;

-- Remover TODAS as políticas das tabelas transactions
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'transactions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON transactions';
    END LOOP;
END $$;

-- Remover TODAS as políticas das tabelas goals
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'goals'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON goals';
    END LOOP;
END $$;

-- ==========================================
-- ETAPA 2: VERIFICAR SE LIMPEZA FOI BEM-SUCEDIDA
-- ==========================================

-- Esta query deve retornar 0 registos se a limpeza foi bem-sucedida
SELECT COUNT(*) as policies_restantes 
FROM pg_policies 
WHERE tablename IN ('families', 'family_members', 'family_invites', 'transactions', 'goals');

-- ==========================================
-- ETAPA 3: REATIVAR RLS E CRIAR POLÍTICAS NOVAS
-- ==========================================

-- Reativar RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- ========== POLÍTICAS FAMILIES ==========

CREATE POLICY "families_select_policy" ON families
    FOR SELECT USING (
        created_by = auth.uid() 
        OR 
        id IN (
            SELECT fm.family_id 
            FROM family_members fm 
            WHERE fm.user_id = auth.uid()
        )
    );

CREATE POLICY "families_insert_policy" ON families
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "families_update_policy" ON families
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "families_delete_policy" ON families
    FOR DELETE USING (created_by = auth.uid());

-- ========== POLÍTICAS FAMILY_MEMBERS (SEM RECURSÃO) ==========

CREATE POLICY "family_members_select_policy" ON family_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR 
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM family_members fm2
            WHERE fm2.family_id = family_members.family_id 
            AND fm2.user_id = auth.uid()
        )
    );

CREATE POLICY "family_members_insert_policy" ON family_members
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

CREATE POLICY "family_members_update_policy" ON family_members
    FOR UPDATE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

CREATE POLICY "family_members_delete_policy" ON family_members
    FOR DELETE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- ========== POLÍTICAS FAMILY_INVITES ==========

CREATE POLICY "family_invites_select_policy" ON family_invites
    FOR SELECT USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
        OR
        family_id IN (
            SELECT fm.family_id FROM family_members fm
            WHERE fm.user_id = auth.uid()
        )
        OR
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "family_invites_insert_policy" ON family_invites
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

CREATE POLICY "family_invites_update_policy" ON family_invites
    FOR UPDATE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
        OR
        (email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'pending')
    );

CREATE POLICY "family_invites_delete_policy" ON family_invites
    FOR DELETE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

-- ========== POLÍTICAS TRANSACTIONS ==========

CREATE POLICY "transactions_select_policy" ON transactions
    FOR SELECT USING (
        (family_id IS NULL AND user_id = auth.uid())
        OR 
        (family_id IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM family_members fm 
             WHERE fm.family_id = transactions.family_id 
             AND fm.user_id = auth.uid()
         ))
    );

CREATE POLICY "transactions_insert_policy" ON transactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND (
            family_id IS NULL
            OR 
            EXISTS (
                SELECT 1 FROM family_members fm 
                WHERE fm.family_id = transactions.family_id 
                AND fm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "transactions_update_policy" ON transactions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "transactions_delete_policy" ON transactions
    FOR DELETE USING (user_id = auth.uid());

-- ========== POLÍTICAS GOALS ==========

CREATE POLICY "goals_select_policy" ON goals
    FOR SELECT USING (
        (family_id IS NULL AND user_id = auth.uid())
        OR 
        (family_id IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM family_members fm 
             WHERE fm.family_id = goals.family_id 
             AND fm.user_id = auth.uid()
         ))
    );

CREATE POLICY "goals_insert_policy" ON goals
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND (
            family_id IS NULL
            OR 
            EXISTS (
                SELECT 1 FROM family_members fm 
                WHERE fm.family_id = goals.family_id 
                AND fm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "goals_update_policy" ON goals
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "goals_delete_policy" ON goals
    FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- ETAPA 4: VERIFICAÇÃO FINAL
-- ==========================================

-- Verificar todas as políticas criadas
SELECT 
    tablename,
    policyname,
    cmd as operacao
FROM pg_policies 
WHERE tablename IN ('families', 'family_members', 'family_invites', 'transactions', 'goals')
ORDER BY tablename, cmd, policyname;

-- Testar queries básicas (devem funcionar sem recursão)
SELECT 'Teste families' as teste, COUNT(*) as total FROM families;
SELECT 'Teste family_members' as teste, COUNT(*) as total FROM family_members;
SELECT 'Teste family_invites' as teste, COUNT(*) as total FROM family_invites;
SELECT 'Teste transactions' as teste, COUNT(*) as total FROM transactions;
SELECT 'Teste goals' as teste, COUNT(*) as total FROM goals;

-- ==========================================
-- SUCESSO! 
-- ==========================================
-- Se chegou até aqui sem erros, a recursão foi eliminada!
-- Pode voltar à aplicação e testar criar transações familiares. 