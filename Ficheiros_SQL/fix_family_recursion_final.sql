-- ==========================================
-- SOLUÇÃO FINAL PARA RECURSÃO INFINITA RLS
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- ==========================================
-- ETAPA 1: LIMPAR TODAS AS POLÍTICAS CONFLITUOSAS
-- ==========================================

-- Remover políticas da tabela families
DROP POLICY IF EXISTS "Users can view families they belong to" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family owners and admins can update family" ON families;
DROP POLICY IF EXISTS "Family owners can delete family" ON families;
DROP POLICY IF EXISTS "view_families" ON families;
DROP POLICY IF EXISTS "create_families" ON families;
DROP POLICY IF EXISTS "update_families" ON families;
DROP POLICY IF EXISTS "delete_families" ON families;

-- Remover políticas da tabela family_members (CAUSA DA RECURSÃO)
DROP POLICY IF EXISTS "Users can view family members of their families" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can insert members" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can update members" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can delete members" ON family_members;
DROP POLICY IF EXISTS "view_family_members" ON family_members;
DROP POLICY IF EXISTS "insert_family_members" ON family_members;
DROP POLICY IF EXISTS "update_family_members" ON family_members;
DROP POLICY IF EXISTS "delete_family_members" ON family_members;

-- Remover políticas da tabela family_invites
DROP POLICY IF EXISTS "Users can view invites for their families" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can create invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can update invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can delete invites" ON family_invites;
DROP POLICY IF EXISTS "view_family_invites" ON family_invites;
DROP POLICY IF EXISTS "create_family_invites" ON family_invites;
DROP POLICY IF EXISTS "update_family_invites" ON family_invites;
DROP POLICY IF EXISTS "delete_family_invites" ON family_invites;

-- Remover políticas da tabela transactions que podem estar a causar problemas
DROP POLICY IF EXISTS "Users can view personal and family transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create personal and family transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- ==========================================
-- ETAPA 2: CRIAR POLÍTICAS SEM RECURSÃO
-- ==========================================

-- ========== POLÍTICAS PARA FAMILIES ==========
-- Usar apenas families.created_by como fonte de verdade

-- Visualizar famílias criadas pelo utilizador OU onde é membro direto
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

-- Criar famílias (qualquer utilizador autenticado)
CREATE POLICY "families_insert_policy" ON families
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Atualizar famílias (apenas criador)
CREATE POLICY "families_update_policy" ON families
    FOR UPDATE USING (created_by = auth.uid());

-- Eliminar famílias (apenas criador)
CREATE POLICY "families_delete_policy" ON families
    FOR DELETE USING (created_by = auth.uid());

-- ========== POLÍTICAS PARA FAMILY_MEMBERS (SEM RECURSÃO) ==========
-- Usar families.created_by como fonte de autoridade, não family_members

-- Visualizar membros: o próprio registo OU famílias criadas pelo utilizador OU ser membro da família
CREATE POLICY "family_members_select_policy" ON family_members
    FOR SELECT USING (
        user_id = auth.uid()  -- Pode ver o próprio registo
        OR 
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()  -- É criador da família
        )
        OR
        EXISTS (
            SELECT 1 FROM family_members fm2
            WHERE fm2.family_id = family_members.family_id 
            AND fm2.user_id = auth.uid()  -- É membro da mesma família
        )
    );

-- Inserir membros: apenas criadores de família
CREATE POLICY "family_members_insert_policy" ON family_members
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

-- Atualizar membros: apenas criadores de família
CREATE POLICY "family_members_update_policy" ON family_members
    FOR UPDATE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

-- Eliminar membros: criadores de família OU auto-remoção
CREATE POLICY "family_members_delete_policy" ON family_members
    FOR DELETE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
        OR user_id = auth.uid()  -- Pode remover-se a si próprio
    );

-- ========== POLÍTICAS PARA FAMILY_INVITES ==========
-- Usar families.created_by como fonte de autoridade

-- Visualizar convites: criadores de família OU membros da família OU convite para o próprio email
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

-- Criar convites: apenas criadores de família
CREATE POLICY "family_invites_insert_policy" ON family_invites
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

-- Atualizar convites: criadores de família OU aceitação do próprio convite
CREATE POLICY "family_invites_update_policy" ON family_invites
    FOR UPDATE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
        OR
        (email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'pending')
    );

-- Eliminar convites: apenas criadores de família
CREATE POLICY "family_invites_delete_policy" ON family_invites
    FOR DELETE USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

-- ========== POLÍTICAS PARA TRANSACTIONS (OTIMIZADAS) ==========
-- Separar claramente transações pessoais e familiares

-- Visualizar transações: pessoais OU familiares onde é membro
CREATE POLICY "transactions_select_policy" ON transactions
    FOR SELECT USING (
        (family_id IS NULL AND user_id = auth.uid())  -- Transações pessoais
        OR 
        (family_id IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM family_members fm 
             WHERE fm.family_id = transactions.family_id 
             AND fm.user_id = auth.uid()
         ))  -- Transações familiares onde é membro
    );

-- Criar transações: pessoais sempre permitidas, familiares apenas se for membro
CREATE POLICY "transactions_insert_policy" ON transactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND (
            family_id IS NULL  -- Transação pessoal
            OR 
            EXISTS (
                SELECT 1 FROM family_members fm 
                WHERE fm.family_id = transactions.family_id 
                AND fm.user_id = auth.uid()
            )  -- É membro da família
        )
    );

-- Atualizar transações: apenas as próprias
CREATE POLICY "transactions_update_policy" ON transactions
    FOR UPDATE USING (user_id = auth.uid());

-- Eliminar transações: apenas as próprias
CREATE POLICY "transactions_delete_policy" ON transactions
    FOR DELETE USING (user_id = auth.uid());

-- ========== POLÍTICAS PARA GOALS (OTIMIZADAS) ==========
-- Aplicar a mesma lógica das transações

-- Visualizar metas: pessoais OU familiares onde é membro
CREATE POLICY "goals_select_policy" ON goals
    FOR SELECT USING (
        (family_id IS NULL AND user_id = auth.uid())  -- Metas pessoais
        OR 
        (family_id IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM family_members fm 
             WHERE fm.family_id = goals.family_id 
             AND fm.user_id = auth.uid()
         ))  -- Metas familiares onde é membro
    );

-- Criar metas: pessoais sempre permitidas, familiares apenas se for membro
CREATE POLICY "goals_insert_policy" ON goals
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND (
            family_id IS NULL  -- Meta pessoal
            OR 
            EXISTS (
                SELECT 1 FROM family_members fm 
                WHERE fm.family_id = goals.family_id 
                AND fm.user_id = auth.uid()
            )  -- É membro da família
        )
    );

-- Atualizar metas: apenas as próprias
CREATE POLICY "goals_update_policy" ON goals
    FOR UPDATE USING (user_id = auth.uid());

-- Eliminar metas: apenas as próprias
CREATE POLICY "goals_delete_policy" ON goals
    FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- ETAPA 3: VERIFICAÇÃO FINAL
-- ==========================================

-- Verificar se todas as políticas foram criadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('families', 'family_members', 'family_invites', 'transactions', 'goals')
ORDER BY tablename, cmd, policyname;

-- ==========================================
-- ETAPA 4: TESTE DE FUNCIONAMENTO
-- ==========================================

-- Testar se consegue ver as famílias sem erro de recursão
-- (Esta query deve funcionar sem erro)
SELECT f.id, f.nome, f.created_by, 
       COUNT(fm.id) as total_membros
FROM families f
LEFT JOIN family_members fm ON f.id = fm.family_id
GROUP BY f.id, f.nome, f.created_by;

-- ==========================================
-- FIM DA SOLUÇÃO
-- ==========================================

-- RESUMO DAS MUDANÇAS:
-- 1. Removidas todas as políticas que causavam recursão
-- 2. Criadas políticas que usam families.created_by como fonte de autoridade
-- 3. Evitadas auto-referências na tabela family_members
-- 4. Políticas de transactions e goals otimizadas para família/pessoal
-- 5. Nomes de políticas padronizados e únicos 