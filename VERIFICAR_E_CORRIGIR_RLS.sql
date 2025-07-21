-- VERIFICAR E CORRIGIR POLÍTICAS RLS
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Verificar se RLS está ativado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('transactions', 'goals', 'categories', 'families', 'family_members');

-- 2. Ativar RLS se necessário
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 3. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('transactions', 'goals', 'categories')
ORDER BY tablename, policyname;

-- 4. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- 5. Criar políticas corretas para transactions
CREATE POLICY "Enable read for users based on user_id" ON transactions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for users based on user_id" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Criar políticas para goals
CREATE POLICY "Enable read for users based on user_id" ON goals
    FOR SELECT USING (
        auth.uid() = user_id OR 
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for users based on user_id" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Criar políticas para categories
CREATE POLICY "Enable read for users based on user_id" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Verificar políticas criadas
SELECT 
    '=== POLÍTICAS CRIADAS ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('transactions', 'goals', 'categories')
ORDER BY tablename, policyname; 