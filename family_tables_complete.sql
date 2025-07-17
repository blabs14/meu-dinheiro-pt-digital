-- ==========================================
-- CRIAR TABELAS DE GESTÃO FAMILIAR
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- 1. Criar tabela families
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{"allow_view_all": true, "allow_add_transactions": true, "require_approval": false}'::jsonb
);

-- 2. Criar tabela family_members
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions TEXT[] DEFAULT ARRAY['view_transactions'],
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, family_id)
);

-- 3. Criar tabela family_invites
CREATE TABLE IF NOT EXISTS family_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_family_id ON family_invites(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_email ON family_invites(email);
CREATE INDEX IF NOT EXISTS idx_family_invites_status ON family_invites(status);

-- 5. Ativar Row Level Security (RLS)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para families
DO $$ 
BEGIN
  -- Política para visualizar famílias
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'families' AND policyname = 'Users can view families they belong to') THEN
    CREATE POLICY "Users can view families they belong to" ON families
      FOR SELECT USING (
        id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Política para criar famílias
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'families' AND policyname = 'Users can create families') THEN
    CREATE POLICY "Users can create families" ON families
      FOR INSERT WITH CHECK (created_by = auth.uid());
  END IF;

  -- Política para atualizar famílias
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'families' AND policyname = 'Family owners and admins can update family') THEN
    CREATE POLICY "Family owners and admins can update family" ON families
      FOR UPDATE USING (
        id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      );
  END IF;

  -- Política para eliminar famílias
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'families' AND policyname = 'Family owners can delete family') THEN
    CREATE POLICY "Family owners can delete family" ON families
      FOR DELETE USING (
        id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role = 'owner'
        )
      );
  END IF;
END $$;

-- 7. Criar políticas RLS para family_members
DO $$ 
BEGIN
  -- Política para visualizar membros
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Users can view family members of their families') THEN
    CREATE POLICY "Users can view family members of their families" ON family_members
      FOR SELECT USING (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Política para inserir membros
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Family owners and admins can insert members') THEN
    CREATE POLICY "Family owners and admins can insert members" ON family_members
      FOR INSERT WITH CHECK (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      );
  END IF;

  -- Política para atualizar membros
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Family owners and admins can update members') THEN
    CREATE POLICY "Family owners and admins can update members" ON family_members
      FOR UPDATE USING (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      );
  END IF;

  -- Política para eliminar membros
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Family owners and admins can delete members') THEN
    CREATE POLICY "Family owners and admins can delete members" ON family_members
      FOR DELETE USING (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- 8. Criar políticas RLS para family_invites
DO $$ 
BEGIN
  -- Política para visualizar convites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_invites' AND policyname = 'Users can view invites for their families') THEN
    CREATE POLICY "Users can view invites for their families" ON family_invites
      FOR SELECT USING (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Política para criar convites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_invites' AND policyname = 'Family owners and admins can create invites') THEN
    CREATE POLICY "Family owners and admins can create invites" ON family_invites
      FOR INSERT WITH CHECK (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      );
  END IF;

  -- Política para atualizar convites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_invites' AND policyname = 'Family owners and admins can update invites') THEN
    CREATE POLICY "Family owners and admins can update invites" ON family_invites
      FOR UPDATE USING (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      );
  END IF;

  -- Política para eliminar convites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_invites' AND policyname = 'Family owners and admins can delete invites') THEN
    CREATE POLICY "Family owners and admins can delete invites" ON family_invites
      FOR DELETE USING (
        family_id IN (
          SELECT family_id FROM family_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

-- 9. Função para aceitar convites (opcional - funcionalidade avançada)
CREATE OR REPLACE FUNCTION accept_family_invite(invite_token TEXT)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record family_invites;
    new_member_id UUID;
BEGIN
    -- Buscar convite válido
    SELECT * INTO invite_record
    FROM family_invites
    WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT('success', false, 'message', 'Convite inválido ou expirado');
    END IF;
    
    -- Verificar se o utilizador já é membro
    IF EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_id = invite_record.family_id 
        AND user_id = auth.uid()
    ) THEN
        RETURN JSON_BUILD_OBJECT('success', false, 'message', 'Já é membro desta família');
    END IF;
    
    -- Adicionar membro à família
    INSERT INTO family_members (user_id, family_id, role)
    VALUES (auth.uid(), invite_record.family_id, invite_record.role)
    RETURNING id INTO new_member_id;
    
    -- Marcar convite como aceito
    UPDATE family_invites
    SET status = 'accepted'
    WHERE id = invite_record.id;
    
    RETURN JSON_BUILD_OBJECT(
        'success', true, 
        'message', 'Convite aceito com sucesso',
        'family_id', invite_record.family_id,
        'member_id', new_member_id
    );
END;
$$;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

-- Verificar se as tabelas foram criadas
SELECT 
  'families' as table_name, 
  COUNT(*) as record_count 
FROM families
UNION ALL
SELECT 
  'family_members' as table_name, 
  COUNT(*) as record_count 
FROM family_members
UNION ALL
SELECT 
  'family_invites' as table_name, 
  COUNT(*) as record_count 
FROM family_invites; 