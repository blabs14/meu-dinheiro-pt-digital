-- Verificar e corrigir políticas RLS para transações

-- 1. Verificar políticas existentes
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
WHERE tablename = 'transactions';

-- 2. Remover políticas problemáticas se existirem
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- 3. Criar políticas corretas
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- 4. Verificar se as políticas foram criadas
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
WHERE tablename = 'transactions'; 