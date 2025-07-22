-- ==========================================
-- CORREÇÃO URGENTE: POLÍTICAS RLS PROFILES
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- O problema: Utilizadores existentes não conseguem aceder aos seus perfis
-- porque as políticas RLS da tabela profiles podem estar em falta ou incorretas

-- ==========================================
-- ETAPA 1: VERIFICAR ESTADO ATUAL
-- ==========================================

-- Verificar se existem políticas na tabela profiles
SELECT 
    'Políticas profiles existentes:' as status,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Verificar se RLS está ativo
SELECT 
    'RLS status:' as status,
    schemaname, 
    tablename, 
    rowsecurity as rls_ativo
FROM pg_tables 
WHERE tablename = 'profiles';

-- ==========================================
-- ETAPA 2: CORRIGIR POLÍTICAS PROFILES
-- ==========================================

-- Remover políticas existentes da tabela profiles (se houver)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Garantir que RLS está ativo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples e funcionais para profiles
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- ETAPA 3: VERIFICAR SE O PERFIL EXISTE
-- ==========================================

-- Verificar se existe perfil para o utilizador atual
SELECT 
    'Perfil atual:' as status,
    id,
    user_id,
    nome,
    created_at
FROM profiles 
WHERE user_id = auth.uid();

-- ==========================================
-- ETAPA 4: TESTAR ACESSO AO PERFIL
-- ==========================================

-- Esta query deve funcionar sem erro
SELECT 
    'Teste acesso perfil:' as teste,
    COUNT(*) as total_perfis_visiveis
FROM profiles;

-- ==========================================
-- ETAPA 5: VERIFICAÇÃO FINAL
-- ==========================================

-- Confirmar que as políticas foram criadas
SELECT 
    'Políticas profiles criadas:' as status,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ==========================================
-- INSTRUÇÕES ADICIONAIS
-- ==========================================

-- Se ainda assim não conseguir aceder:
-- 1. Verifique se existe registo na tabela profiles para o seu user_id
-- 2. O onboarding pode estar a verificar a existência do perfil incorretamente
-- 3. Pode ser necessário ajustar a lógica no componente OnboardingWizard

-- Para debug: Execute esta query para ver todos os utilizadores e perfis
SELECT 
    au.id as user_id,
    au.email,
    p.id as profile_id,
    p.nome,
    CASE 
        WHEN p.id IS NULL THEN 'SEM PERFIL'
        ELSE 'TEM PERFIL'
    END as status_perfil
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
ORDER BY au.created_at DESC
LIMIT 10; 