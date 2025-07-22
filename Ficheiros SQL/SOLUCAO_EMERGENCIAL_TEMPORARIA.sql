-- ==========================================
-- SOLUÇÃO EMERGENCIAL TEMPORÁRIA
-- Use apenas se a solução definitiva não funcionar
-- ==========================================

-- AVISO: Esta solução DESATIVA temporariamente RLS
-- para permitir que a aplicação funcione enquanto
-- resolvemos os problemas de políticas

-- ==========================================
-- OPÇÃO 1: DESATIVAR RLS TEMPORARIAMENTE
-- ==========================================

-- Desativar RLS em todas as tabelas problemáticas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'categories', 'transactions', 'goals', 
                  'fixed_expenses', 'families', 'family_members', 'family_invites')
ORDER BY tablename;

-- ==========================================
-- OPÇÃO 2: POLÍTICAS SUPER PERMISSIVAS (MENOS SEGURO)
-- ==========================================

-- Se preferir manter RLS mas com políticas muito permissivas:

/*
-- Reativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- Criar políticas que permitem tudo para utilizadores autenticados
CREATE POLICY "temp_allow_all" ON profiles FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "temp_allow_all" ON categories FOR ALL USING (true);
CREATE POLICY "temp_allow_all" ON transactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "temp_allow_all" ON goals FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "temp_allow_all" ON fixed_expenses FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "temp_allow_all" ON families FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "temp_allow_all" ON family_members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "temp_allow_all" ON family_invites FOR ALL USING (auth.uid() IS NOT NULL);
*/

-- ==========================================
-- IMPORTANTE: REATIVAR RLS DEPOIS
-- ==========================================

-- Depois de resolver os problemas, execute a 
-- SOLUCAO_DEFINITIVA_RLS.sql para reativar
-- a segurança adequada

-- ==========================================
-- VERIFICAR SE FUNCIONA
-- ==========================================

-- Após executar, volte à aplicação e:
-- 1. Faça F5 para recarregar
-- 2. Tente fazer login
-- 3. Verifique se o dashboard carrega
-- 4. Teste criar transações

-- Se funcionar, sabemos que o problema está nas políticas RLS
-- e podemos trabalhar numa solução permanente com calma 