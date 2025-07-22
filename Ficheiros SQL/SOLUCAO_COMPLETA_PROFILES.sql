-- ==========================================
-- SOLUÇÃO COMPLETA: PROBLEMAS COM PROFILES
-- Execute no Supabase SQL Editor
-- ==========================================

-- PROBLEMA: Utilizadores não conseguem aceder aos perfis devido a políticas RLS

-- ==========================================
-- ETAPA 1: DIAGNÓSTICO COMPLETO
-- ==========================================

-- 1.1 Verificar utilizadores autenticados
SELECT 
    'Utilizadores registados' as info,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 1.2 Verificar perfis existentes
SELECT 
    'Perfis existentes' as info,
    id,
    user_id,
    nome,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 1.3 Verificar políticas da tabela profiles
SELECT 
    'Políticas profiles atuais' as info,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- ==========================================
-- ETAPA 2: CORREÇÃO DAS POLÍTICAS PROFILES
-- ==========================================

-- Desativar RLS temporariamente para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Reativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas corretas e simples
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- ETAPA 3: CORREÇÃO POLÍTICAS OUTRAS TABELAS BÁSICAS
-- ==========================================

-- Verificar e corrigir políticas das tabelas básicas que podem estar em falta

-- 3.1 Categorias (devem ser visíveis por todos)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_policy" ON categories
    FOR SELECT USING (true); -- Todas as categorias são públicas

-- 3.2 Fixed Expenses
DROP POLICY IF EXISTS "fixed_expenses_select_policy" ON fixed_expenses;
DROP POLICY IF EXISTS "fixed_expenses_insert_policy" ON fixed_expenses;
DROP POLICY IF EXISTS "fixed_expenses_update_policy" ON fixed_expenses;
DROP POLICY IF EXISTS "fixed_expenses_delete_policy" ON fixed_expenses;

CREATE POLICY "fixed_expenses_select_policy" ON fixed_expenses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "fixed_expenses_insert_policy" ON fixed_expenses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "fixed_expenses_update_policy" ON fixed_expenses
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "fixed_expenses_delete_policy" ON fixed_expenses
    FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- ETAPA 4: TESTE DE FUNCIONAMENTO
-- ==========================================

-- 4.1 Testar acesso a perfis
SELECT 
    'Teste acesso profiles' as teste,
    COUNT(*) as total_visiveis
FROM profiles;

-- 4.2 Testar acesso a categorias
SELECT 
    'Teste acesso categories' as teste,
    COUNT(*) as total_visiveis
FROM categories;

-- 4.3 Testar acesso a transações
SELECT 
    'Teste acesso transactions' as teste,
    COUNT(*) as total_visiveis
FROM transactions;

-- 4.4 Testar acesso a metas
SELECT 
    'Teste acesso goals' as teste,
    COUNT(*) as total_visiveis
FROM goals;

-- ==========================================
-- ETAPA 5: VERIFICAÇÃO FINAL
-- ==========================================

-- 5.1 Verificar todas as políticas criadas
SELECT 
    'Políticas criadas' as status,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'categories', 'fixed_expenses', 'families', 'family_members', 'family_invites', 'transactions', 'goals')
ORDER BY tablename, cmd;

-- 5.2 Verificar perfil do utilizador atual (deve mostrar dados)
SELECT 
    'Perfil atual' as info,
    id,
    user_id,
    nome,
    percentual_divisao,
    poupanca_mensal
FROM profiles 
WHERE user_id = auth.uid();

-- ==========================================
-- ETAPA 6: CRIAÇÃO DE PERFIL SE NECESSÁRIO
-- ==========================================

-- Se o utilizador não tem perfil, criar um básico
-- (Esta parte só vai executar se não existir perfil)
INSERT INTO profiles (user_id, nome)
SELECT 
    auth.uid(),
    'Utilizador' -- Nome temporário
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid()
)
AND auth.uid() IS NOT NULL;

-- ==========================================
-- ETAPA 7: RESULTADO FINAL
-- ==========================================

-- Mostrar estado final
SELECT 
    'Estado final' as resultado,
    (SELECT COUNT(*) FROM profiles WHERE user_id = auth.uid()) as tem_perfil,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_profiles,
    auth.uid() as user_id_atual;

-- ==========================================
-- INSTRUÇÕES PÓS-EXECUÇÃO
-- ==========================================

-- Após executar este SQL:
-- 1. Volte à aplicação e recarregue a página
-- 2. Faça logout e login novamente
-- 3. O onboarding não deve mais aparecer para utilizadores existentes
-- 4. Se ainda aparecer, há um problema no código React que pode precisar de ajuste 