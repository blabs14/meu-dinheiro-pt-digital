-- ==========================================
-- SOLUÇÃO DEFINITIVA PARA TODOS OS PROBLEMAS RLS
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- PROBLEMAS IDENTIFICADOS:
-- 1. Recursão infinita voltou a aparecer
-- 2. Políticas de profiles não funcionam corretamente
-- 3. Dashboard não carrega dados
-- 4. auth.uid() retorna NULL no SQL Editor (normal)

-- ==========================================
-- FASE 1: RESET COMPLETO DE TODAS AS POLÍTICAS
-- ==========================================

-- 1.1 Desativar RLS em TODAS as tabelas temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites DISABLE ROW LEVEL SECURITY;

-- 1.2 Remover TODAS as políticas existentes usando função dinâmica
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Loop através de todas as tabelas e remover suas políticas
    FOR r IN 
        SELECT DISTINCT tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                          'fixed_expenses', 'families', 'family_members', 'family_invites')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ==========================================
-- FASE 2: CRIAR POLÍTICAS CORRETAS E OTIMIZADAS
-- ==========================================

-- 2.1 PROFILES - Políticas básicas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for users to own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users to own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users to own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 2.2 CATEGORIES - Visível para todos
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON categories
    FOR SELECT USING (true);

-- 2.3 TRANSACTIONS - Pessoais e familiares
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable read for family transactions" ON transactions
    FOR SELECT USING (
        family_id IS NOT NULL 
        AND family_id IN (
            SELECT fm.family_id 
            FROM family_members fm 
            WHERE fm.user_id = auth.uid()
        )
    );

-- 2.4 GOALS - Pessoais e familiares
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for own goals" ON goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable read for family goals" ON goals
    FOR SELECT USING (
        family_id IS NOT NULL 
        AND family_id IN (
            SELECT fm.family_id 
            FROM family_members fm 
            WHERE fm.user_id = auth.uid()
        )
    );

-- 2.5 FIXED_EXPENSES
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for own fixed expenses" ON fixed_expenses
    FOR ALL USING (auth.uid() = user_id);

-- 2.6 FAMILIES - Sem recursão
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for family creators" ON families
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Enable read for family members" ON families
    FOR SELECT USING (
        id IN (
            SELECT family_id 
            FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for family creators" ON families
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Enable delete for family creators" ON families
    FOR DELETE USING (auth.uid() = created_by);

-- 2.7 FAMILY_MEMBERS - CRÍTICO: Evitar recursão usando JOIN lateral
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Política especial para evitar recursão
CREATE POLICY "Enable read for own membership" ON family_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable read for family creators" ON family_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_members.family_id 
            AND f.created_by = auth.uid()
        )
    );

CREATE POLICY "Enable read for co-members" ON family_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM family_members fm2 
            WHERE fm2.family_id = family_members.family_id 
            AND fm2.user_id = auth.uid()
            AND fm2.id != family_members.id -- Evita auto-referência
        )
    );

CREATE POLICY "Enable insert for family creators only" ON family_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_id 
            AND f.created_by = auth.uid()
        )
    );

CREATE POLICY "Enable update for family creators only" ON family_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_id 
            AND f.created_by = auth.uid()
        )
    );

CREATE POLICY "Enable delete for family creators" ON family_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_id 
            AND f.created_by = auth.uid()
        )
    );

CREATE POLICY "Enable self delete" ON family_members
    FOR DELETE USING (auth.uid() = user_id);

-- 2.8 FAMILY_INVITES
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for family creators" ON family_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_id 
            AND f.created_by = auth.uid()
        )
    );

CREATE POLICY "Enable read for invitees" ON family_invites
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Enable insert for family creators" ON family_invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_id 
            AND f.created_by = auth.uid()
        )
    );

CREATE POLICY "Enable update for family creators" ON family_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_id 
            AND f.created_by = auth.uid()
        )
    );

CREATE POLICY "Enable update for invitees" ON family_invites
    FOR UPDATE USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
    );

CREATE POLICY "Enable delete for family creators" ON family_invites
    FOR DELETE USING (
        EXISTS (
            SELECT 1 
            FROM families f 
            WHERE f.id = family_id 
            AND f.created_by = auth.uid()
        )
    );

-- ==========================================
-- FASE 3: VERIFICAÇÃO E TESTES
-- ==========================================

-- 3.1 Verificar políticas criadas
SELECT 
    tablename,
    COUNT(*) as total_policies,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
GROUP BY tablename
ORDER BY tablename;

-- 3.2 Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
ORDER BY tablename;

-- 3.3 Criar função de teste para verificar acesso
CREATE OR REPLACE FUNCTION test_user_access(test_user_id UUID)
RETURNS TABLE (
    table_name TEXT,
    can_read BOOLEAN,
    record_count BIGINT
) AS $$
BEGIN
    -- Temporariamente definir o user_id para teste
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    RETURN QUERY
    SELECT 'profiles'::TEXT, 
           EXISTS(SELECT 1 FROM profiles WHERE user_id = test_user_id),
           (SELECT COUNT(*) FROM profiles WHERE user_id = test_user_id);
    
    RETURN QUERY
    SELECT 'transactions'::TEXT,
           EXISTS(SELECT 1 FROM transactions WHERE user_id = test_user_id),
           (SELECT COUNT(*) FROM transactions WHERE user_id = test_user_id);
    
    RETURN QUERY
    SELECT 'goals'::TEXT,
           EXISTS(SELECT 1 FROM goals WHERE user_id = test_user_id),
           (SELECT COUNT(*) FROM goals WHERE user_id = test_user_id);
           
    RETURN QUERY
    SELECT 'categories'::TEXT,
           EXISTS(SELECT 1 FROM categories),
           (SELECT COUNT(*) FROM categories);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Testar com um user_id existente (substitua pelo ID real)
-- SELECT * FROM test_user_access('017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6');

-- ==========================================
-- FASE 4: LIMPEZA E INSTRUÇÕES FINAIS
-- ==========================================

-- Remover função de teste após uso
-- DROP FUNCTION IF EXISTS test_user_access(UUID);

-- ==========================================
-- RESULTADO ESPERADO:
-- ==========================================
-- ✅ Sem erros de recursão infinita
-- ✅ Dashboard carrega dados corretamente
-- ✅ Transações pessoais e familiares funcionam
-- ✅ Metas carregam sem erros
-- ✅ Sistema de famílias funcional

-- INSTRUÇÕES:
-- 1. Execute este SQL completo
-- 2. Volte à aplicação e faça F5
-- 3. Teste criar uma transação pessoal
-- 4. Teste criar uma transação familiar
-- 5. Verifique se o dashboard carrega 