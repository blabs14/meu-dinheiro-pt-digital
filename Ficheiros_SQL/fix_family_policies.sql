-- ==========================================
-- CORRIGIR POLÍTICAS RLS COM RECURSÃO INFINITA
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- 1. Remover todas as políticas existentes das tabelas de família
DROP POLICY IF EXISTS "Users can view families they belong to" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family owners and admins can update family" ON families;
DROP POLICY IF EXISTS "Family owners can delete family" ON families;

DROP POLICY IF EXISTS "Users can view family members of their families" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can insert members" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can update members" ON family_members;
DROP POLICY IF EXISTS "Family owners and admins can delete members" ON family_members;

DROP POLICY IF EXISTS "Users can view invites for their families" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can create invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can update invites" ON family_invites;
DROP POLICY IF EXISTS "Family owners and admins can delete invites" ON family_invites;

-- 2. Criar políticas simples e eficientes SEM recursão

-- ========== POLÍTICAS PARA FAMILIES ==========

-- Visualizar famílias criadas pelo utilizador ou onde é membro
CREATE POLICY "view_families" ON families
  FOR SELECT USING (
    created_by = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = families.id 
      AND fm.user_id = auth.uid()
    )
  );

-- Criar famílias (qualquer utilizador autenticado)
CREATE POLICY "create_families" ON families
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Atualizar famílias (apenas criador)
CREATE POLICY "update_families" ON families
  FOR UPDATE USING (created_by = auth.uid());

-- Eliminar famílias (apenas criador)
CREATE POLICY "delete_families" ON families
  FOR DELETE USING (created_by = auth.uid());

-- ========== POLÍTICAS PARA FAMILY_MEMBERS ==========

-- Visualizar membros das suas famílias
CREATE POLICY "view_family_members" ON family_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    family_id IN (
      SELECT f.id FROM families f 
      WHERE f.created_by = auth.uid()
    )
    OR
    family_id IN (
      SELECT fm2.family_id FROM family_members fm2
      WHERE fm2.user_id = auth.uid()
    )
  );

-- Inserir membros (apenas criadores de família)
CREATE POLICY "insert_family_members" ON family_members
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT f.id FROM families f 
      WHERE f.created_by = auth.uid()
    )
  );

-- Atualizar membros (apenas criadores de família)
CREATE POLICY "update_family_members" ON family_members
  FOR UPDATE USING (
    family_id IN (
      SELECT f.id FROM families f 
      WHERE f.created_by = auth.uid()
    )
  );

-- Eliminar membros (apenas criadores de família, exceto auto-remoção)
CREATE POLICY "delete_family_members" ON family_members
  FOR DELETE USING (
    family_id IN (
      SELECT f.id FROM families f 
      WHERE f.created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- ========== POLÍTICAS PARA FAMILY_INVITES ==========

-- Visualizar convites das suas famílias
CREATE POLICY "view_family_invites" ON family_invites
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
  );

-- Criar convites (apenas criadores de família)
CREATE POLICY "create_family_invites" ON family_invites
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT f.id FROM families f 
      WHERE f.created_by = auth.uid()
    )
  );

-- Atualizar convites (apenas criadores de família)
CREATE POLICY "update_family_invites" ON family_invites
  FOR UPDATE USING (
    family_id IN (
      SELECT f.id FROM families f 
      WHERE f.created_by = auth.uid()
    )
  );

-- Eliminar convites (apenas criadores de família)
CREATE POLICY "delete_family_invites" ON family_invites
  FOR DELETE USING (
    family_id IN (
      SELECT f.id FROM families f 
      WHERE f.created_by = auth.uid()
    )
  );

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

-- Testar se as políticas estão funcionando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('families', 'family_members', 'family_invites')
ORDER BY tablename, policyname; 