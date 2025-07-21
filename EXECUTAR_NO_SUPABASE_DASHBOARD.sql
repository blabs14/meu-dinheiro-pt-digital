-- ==========================================
-- EXECUTAR NO SUPABASE DASHBOARD SQL EDITOR
-- SOLUÇÃO PARA RECURSÃO INFINITA RLS
-- ==========================================

-- ==========================================
-- ETAPA 1: LIMPAR POLÍTICAS (Execute primeiro)
-- ==========================================

-- Families
DROP POLICY IF EXISTS "Users can view families they belong to" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family owners and admins can update family" ON families;
DROP POLICY IF EXISTS "Family owners can delete family" ON families;
DROP POLICY IF EXISTS "view_families" ON families;
DROP POLICY IF EXISTS "create_families" ON families;
DROP POLICY IF EXISTS "update_families" ON families;
DROP POLICY IF EXISTS "delete_families" ON families;

-- Family Members (CAUSA DA RECURSÃO)
DROP POLICY IF EXISTS "Users can view family members of their families" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can insert members" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can update members" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can delete members" ON family_members;
DROP POLICY IF EXISTS "view_family_members" ON family_members;
DROP POLICY IF EXISTS "insert_family_members" ON family_members;
DROP POLICY IF EXISTS "update_family_members" ON family_members;
DROP POLICY IF EXISTS "delete_family_members" ON family_members;

-- Family Invites
DROP POLICY IF EXISTS "Users can view invites for their families" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can create invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can update invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can delete invites" ON family_invites;
DROP POLICY IF EXISTS "view_family_invites" ON family_invites;
DROP POLICY IF EXISTS "create_family_invites" ON family_invites;
DROP POLICY IF EXISTS "update_family_invites" ON family_invites;
DROP POLICY IF EXISTS "delete_family_invites" ON family_invites;

-- Transactions
DROP POLICY IF EXISTS "Users can view personal and family transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create personal and family transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- ==========================================
-- ETAPA 2: CRIAR POLÍTICAS FAMILIES (Execute depois)
-- ==========================================

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

-- ==========================================
-- ETAPA 3: CRIAR POLÍTICAS FAMILY_MEMBERS (Execute a seguir)
-- ==========================================

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

-- ==========================================
-- ETAPA 4: CRIAR POLÍTICAS FAMILY_INVITES (Execute a seguir)
-- ==========================================

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

-- ==========================================
-- ETAPA 5: CRIAR POLÍTICAS TRANSACTIONS (Execute a seguir)
-- ==========================================

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

-- ==========================================
-- ETAPA 6: CRIAR POLÍTICAS GOALS (Execute por último)
-- ==========================================

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
-- ETAPA 7: VERIFICAÇÃO (Execute para testar)
-- ==========================================

-- Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('families', 'family_members', 'family_invites', 'transactions', 'goals')
ORDER BY tablename, cmd;

-- Testar query simples (deve funcionar sem erro)
SELECT COUNT(*) as total_families FROM families;
SELECT COUNT(*) as total_members FROM family_members;

-- ==========================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- ==========================================
-- 1. Copie e cole a ETAPA 1 no SQL Editor do Supabase
-- 2. Execute e aguarde conclusão
-- 3. Copie e cole a ETAPA 2, execute
-- 4. Continue até ETAPA 6
-- 5. Execute ETAPA 7 para verificar
-- ========================================== 