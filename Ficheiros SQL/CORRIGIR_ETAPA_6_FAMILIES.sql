-- ==========================================
-- CORREÇÃO ESPECÍFICA PARA ETAPA 6 - FAMILIES
-- ==========================================

-- O problema: As políticas de families estão a bloquear
-- o acesso aos dados porque tentam verificar family_members
-- que ainda não tem RLS ativo

-- ==========================================
-- PASSO 1: REVERTER ETAPA 6
-- ==========================================

-- Desativar RLS em families temporariamente
ALTER TABLE families DISABLE ROW LEVEL SECURITY;

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "families_creator_all" ON families;
DROP POLICY IF EXISTS "families_members_read" ON families;

-- ==========================================
-- PASSO 2: VERIFICAR QUE TUDO VOLTOU A FUNCIONAR
-- ==========================================

-- Teste a aplicação agora - deve voltar a funcionar
-- Se funcionar, continue com o PASSO 3

-- ==========================================
-- PASSO 3: RECRIAR POLÍTICAS FAMILIES SEM DEPENDÊNCIAS
-- ==========================================

-- Reativar RLS em families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Criar política ÚNICA e SIMPLES para families
-- Por enquanto, apenas criadores podem ver suas famílias
CREATE POLICY "families_simple_access" ON families
    FOR ALL
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- NOTA: Esta política é limitada mas funcional
-- Membros não-criadores não verão a família por enquanto
-- Mas evita o erro de recursão

-- ==========================================
-- PASSO 4: TESTAR
-- ==========================================

-- Teste agora se:
-- 1. Dashboard carrega
-- 2. Transações aparecem
-- 3. Metas aparecem
-- 4. Consegue criar novos dados

-- ==========================================
-- PASSO 5: CONTINUAR COM ETAPA 7 MODIFICADA
-- ==========================================

-- Se funcionar, podemos continuar com family_members
-- mas com uma abordagem diferente

-- 5.1 Ativar RLS em family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 5.2 Criar políticas simples primeiro
CREATE POLICY "fm_simple_read" ON family_members
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "fm_simple_write" ON family_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "fm_simple_update" ON family_members
    FOR UPDATE
    TO authenticated
    USING (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "fm_simple_delete" ON family_members
    FOR DELETE
    TO authenticated
    USING (
        family_id IN (
            SELECT id FROM families WHERE created_by = auth.uid()
        )
        OR auth.uid() = user_id
    );

-- ==========================================
-- PASSO 6: AGORA ADICIONAR POLÍTICA DE MEMBROS EM FAMILIES
-- ==========================================

-- Agora que family_members tem RLS, podemos adicionar
-- a política que permite membros verem a família

CREATE POLICY "families_members_can_read" ON families
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT family_id 
            FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

-- ==========================================
-- PASSO 7: TESTE FINAL
-- ==========================================

-- Verifique se:
-- 1. Tudo continua a funcionar
-- 2. Membros de família podem ver a família
-- 3. Não há erros de recursão

-- ==========================================
-- VERIFICAÇÃO DO ESTADO
-- ==========================================

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN ('families', 'family_members')
ORDER BY tablename;

-- ==========================================
-- SE AINDA HOUVER PROBLEMAS
-- ==========================================

-- Execute isto para reverter:
/*
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
DROP POLICY ALL ON families;
DROP POLICY ALL ON family_members;
*/ 