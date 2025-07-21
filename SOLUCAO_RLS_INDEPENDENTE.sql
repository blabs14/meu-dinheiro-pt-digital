-- ==========================================
-- SOLUÇÃO RLS INDEPENDENTE - SEM DEPENDÊNCIAS
-- ==========================================

-- Esta solução cria políticas RLS que não dependem
-- de outras tabelas, evitando completamente recursão

-- ==========================================
-- PASSO 1: LIMPAR TUDO E COMEÇAR DO ZERO
-- ==========================================

-- Desativar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
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

-- ==========================================
-- PASSO 2: CRIAR FUNÇÃO AUXILIAR
-- ==========================================

-- Criar função que retorna IDs de famílias do utilizador
-- Isto evita subqueries nas políticas
CREATE OR REPLACE FUNCTION get_user_families(user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT COALESCE(fm.family_id, f.id) as family_id
    FROM families f
    LEFT JOIN family_members fm ON f.id = fm.family_id
    WHERE f.created_by = user_id 
       OR fm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- PASSO 3: POLÍTICAS SIMPLES SEM DEPENDÊNCIAS
-- ==========================================

-- 3.1 PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles
    FOR ALL USING (auth.uid() = user_id);

-- 3.2 CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON categories
    FOR SELECT USING (true);

-- 3.3 TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Transações próprias
CREATE POLICY "transactions_own" ON transactions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Transações familiares (usando função)
CREATE POLICY "transactions_family_read" ON transactions
    FOR SELECT
    USING (
        family_id IS NOT NULL 
        AND family_id IN (SELECT get_user_families(auth.uid()))
    );

-- 3.4 GOALS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Metas próprias
CREATE POLICY "goals_own" ON goals
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Metas familiares (usando função)
CREATE POLICY "goals_family_read" ON goals
    FOR SELECT
    USING (
        family_id IS NOT NULL 
        AND family_id IN (SELECT get_user_families(auth.uid()))
    );

-- 3.5 FIXED_EXPENSES
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fixed_expenses_own" ON fixed_expenses
    FOR ALL USING (auth.uid() = user_id);

-- 3.6 FAMILIES
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Usando a função auxiliar
CREATE POLICY "families_access" ON families
    FOR ALL
    USING (id IN (SELECT get_user_families(auth.uid())))
    WITH CHECK (auth.uid() = created_by);

-- 3.7 FAMILY_MEMBERS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Membros das famílias do utilizador
CREATE POLICY "family_members_read" ON family_members
    FOR SELECT
    USING (family_id IN (SELECT get_user_families(auth.uid())));

-- Apenas criadores podem modificar
CREATE POLICY "family_members_write" ON family_members
    FOR INSERT
    WITH CHECK (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "family_members_update" ON family_members
    FOR UPDATE
    USING (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

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

-- Convites das famílias do utilizador
CREATE POLICY "family_invites_family" ON family_invites
    FOR ALL
    USING (family_id IN (SELECT get_user_families(auth.uid())))
    WITH CHECK (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

-- Convites para o próprio email
CREATE POLICY "family_invites_own" ON family_invites
    FOR SELECT
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ==========================================
-- PASSO 4: VERIFICAÇÃO
-- ==========================================

-- Verificar estado final
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policies
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
ORDER BY tablename;

-- Testar a função auxiliar
SELECT * FROM get_user_families(auth.uid());

-- ==========================================
-- VANTAGENS DESTA ABORDAGEM
-- ==========================================

-- 1. Função auxiliar centraliza lógica de famílias
-- 2. Evita subqueries complexas nas políticas
-- 3. Sem recursão entre tabelas
-- 4. Mais fácil de manter e debugar
-- 5. Performance melhor com função STABLE

-- ==========================================
-- LIMPEZA (SE NECESSÁRIO)
-- ==========================================

-- Para remover a função:
-- DROP FUNCTION IF EXISTS get_user_families(UUID); 