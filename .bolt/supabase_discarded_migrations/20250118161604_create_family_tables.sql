-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela families
CREATE TABLE families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{
        "allow_view_all": true,
        "allow_add_transactions": true,
        "require_approval": false
    }'::jsonb
);

-- Criar tabela family_members
CREATE TABLE family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions TEXT[] DEFAULT ARRAY['view_transactions'],
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, family_id)
);

-- Criar tabela family_invites
CREATE TABLE family_invites (
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

-- Índices para performance
CREATE INDEX idx_families_created_by ON families(created_by);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_invites_family_id ON family_invites(family_id);
CREATE INDEX idx_family_invites_email ON family_invites(email);
CREATE INDEX idx_family_invites_status ON family_invites(status);

-- Triggers para updated_at
CREATE TRIGGER trigger_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- RLS (Row Level Security)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para families
CREATE POLICY "Users can view families they belong to" ON families
    FOR SELECT USING (
        id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Family owners and admins can update family" ON families
    FOR UPDATE USING (
        id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Family owners can delete family" ON families
    FOR DELETE USING (
        id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Políticas RLS para family_members
CREATE POLICY "Users can view family members of their families" ON family_members
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Family owners and admins can insert members" ON family_members
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Family owners and admins can update members" ON family_members
    FOR UPDATE USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Family owners and admins can delete members" ON family_members
    FOR DELETE USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Políticas RLS para family_invites
CREATE POLICY "Users can view invites for their families" ON family_invites
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Family owners and admins can create invites" ON family_invites
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Family owners and admins can update invites" ON family_invites
    FOR UPDATE USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Family owners and admins can delete invites" ON family_invites
    FOR DELETE USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Função para aceitar convites
CREATE OR REPLACE FUNCTION accept_family_invite(invite_token TEXT)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER; 