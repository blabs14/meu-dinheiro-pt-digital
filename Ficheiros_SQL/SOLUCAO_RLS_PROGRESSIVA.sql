-- ==========================================
-- SOLUÇÃO RLS PROGRESSIVA - APLICAR POR ETAPAS
-- Execute cada etapa e teste a aplicação entre elas
-- ==========================================

-- Esta solução aplica RLS progressivamente para identificar
-- exatamente onde está o problema

-- ==========================================
-- ETAPA 0: VERIFICAR ESTADO ATUAL (RLS DESATIVADO)
-- ==========================================

SELECT 
    tablename,
    rowsecurity as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
ORDER BY tablename;

-- ==========================================
-- ETAPA 1: ATIVAR RLS APENAS EM PROFILES
-- ==========================================

-- 1.1 Ativar RLS em profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1.2 Criar políticas simples para profiles
CREATE POLICY "profiles_all_access" ON profiles
    FOR ALL 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- TESTE: Volte à aplicação e verifique se ainda funciona

-- ==========================================
-- ETAPA 2: ATIVAR RLS EM CATEGORIES
-- ==========================================

-- 2.1 Ativar RLS em categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2.2 Política permissiva para categories (todos podem ver)
CREATE POLICY "categories_read_all" ON categories
    FOR SELECT
    TO authenticated
    USING (true);

-- TESTE: Verifique se ainda funciona

-- ==========================================
-- ETAPA 3: ATIVAR RLS EM TRANSACTIONS (SEM FAMÍLIA)
-- ==========================================

-- 3.1 Ativar RLS em transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3.2 Política simples - apenas transações próprias primeiro
CREATE POLICY "transactions_own_only" ON transactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- TESTE: Verifique se consegue ver/criar transações pessoais

-- ==========================================
-- ETAPA 4: ATIVAR RLS EM GOALS (SEM FAMÍLIA)
-- ==========================================

-- 4.1 Ativar RLS em goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 4.2 Política simples - apenas metas próprias
CREATE POLICY "goals_own_only" ON goals
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- TESTE: Verifique se consegue ver/criar metas

-- ==========================================
-- ETAPA 5: ATIVAR RLS EM FIXED_EXPENSES
-- ==========================================

-- 5.1 Ativar RLS em fixed_expenses
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

-- 5.2 Política simples
CREATE POLICY "fixed_expenses_own_only" ON fixed_expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- TESTE: Verifique se ainda funciona

-- ==========================================
-- ETAPA 6: ATIVAR RLS EM FAMILIES (CRÍTICO)
-- ==========================================

-- 6.1 Ativar RLS em families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- 6.2 Políticas para families - SIMPLIFICADAS
CREATE POLICY "families_creator_all" ON families
    FOR ALL
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- 6.3 Política adicional para membros verem a família
CREATE POLICY "families_members_read" ON families
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_id = families.id
            AND fm.user_id = auth.uid()
        )
    );

-- TESTE: Verifique se ainda funciona

-- ==========================================
-- ETAPA 7: ATIVAR RLS EM FAMILY_MEMBERS (MAIS CRÍTICO)
-- ==========================================

-- 7.1 Ativar RLS em family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 7.2 Política 1: Ver própria associação
CREATE POLICY "fm_own_membership" ON family_members
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 7.3 Política 2: Criador da família vê todos
CREATE POLICY "fm_family_creator_read" ON family_members
    FOR SELECT
    TO authenticated
    USING (
        family_id IN (
            SELECT id FROM families 
            WHERE created_by = auth.uid()
        )
    );

-- 7.4 Política 3: Criador pode modificar
CREATE POLICY "fm_family_creator_write" ON family_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        family_id IN (
            SELECT id FROM families 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "fm_family_creator_update" ON family_members
    FOR UPDATE
    TO authenticated
    USING (
        family_id IN (
            SELECT id FROM families 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "fm_family_creator_delete" ON family_members
    FOR DELETE
    TO authenticated
    USING (
        family_id IN (
            SELECT id FROM families 
            WHERE created_by = auth.uid()
        )
    );

-- 7.5 Política 4: Utilizador pode sair da família
CREATE POLICY "fm_self_delete" ON family_members
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- TESTE CRÍTICO: Se falhar aqui, sabemos que é family_members

-- ==========================================
-- ETAPA 8: ADICIONAR SUPORTE FAMÍLIA EM TRANSACTIONS/GOALS
-- ==========================================

-- 8.1 Adicionar política para transações familiares
CREATE POLICY "transactions_family_read" ON transactions
    FOR SELECT
    TO authenticated
    USING (
        family_id IS NOT NULL 
        AND family_id IN (
            SELECT fm.family_id 
            FROM family_members fm 
            WHERE fm.user_id = auth.uid()
        )
    );

-- 8.2 Adicionar política para metas familiares
CREATE POLICY "goals_family_read" ON goals
    FOR SELECT
    TO authenticated
    USING (
        family_id IS NOT NULL 
        AND family_id IN (
            SELECT fm.family_id 
            FROM family_members fm 
            WHERE fm.user_id = auth.uid()
        )
    );

-- TESTE: Verifique se consegue ver dados familiares

-- ==========================================
-- ETAPA 9: ATIVAR RLS EM FAMILY_INVITES
-- ==========================================

-- 9.1 Ativar RLS em family_invites
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- 9.2 Políticas simplificadas
CREATE POLICY "fi_family_creator_all" ON family_invites
    FOR ALL
    TO authenticated
    USING (
        family_id IN (
            SELECT id FROM families 
            WHERE created_by = auth.uid()
        )
    )
    WITH CHECK (
        family_id IN (
            SELECT id FROM families 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "fi_invitee_read_update" ON family_invites
    FOR SELECT
    TO authenticated
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "fi_invitee_update" ON family_invites
    FOR UPDATE
    TO authenticated
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
    );

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

-- Ver estado final de todas as tabelas
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
ORDER BY tablename;

-- ==========================================
-- INSTRUÇÕES IMPORTANTES
-- ==========================================

-- 1. Execute ETAPA por ETAPA
-- 2. Teste a aplicação após CADA etapa
-- 3. Se falhar numa etapa, PARE e informe qual etapa falhou
-- 4. Isso nos dirá exatamente onde está o problema

-- Se chegar ao fim sem problemas, teremos RLS funcional!

-- ==========================================
-- ROLLBACK SE NECESSÁRIO
-- ==========================================

-- Se precisar reverter uma etapa específica:
-- ALTER TABLE [tabela] DISABLE ROW LEVEL SECURITY;
-- DROP POLICY ALL ON [tabela]; 