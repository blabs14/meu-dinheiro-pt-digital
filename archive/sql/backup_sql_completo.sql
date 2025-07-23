-- =====================================================
-- BACKUP COMPLETO - MEU DINHEIRO PT DIGITAL
-- Data: 18 de Janeiro de 2025
-- Projeto: ebitcwrrcumsvqjgrapw (Meu_Dinheiro)
-- =====================================================

-- =====================================================
-- 1. FUNÇÕES PERSONALIZADAS
-- =====================================================

-- Função para atualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para aceitar convites de família
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

-- =====================================================
-- 2. DADOS DAS TABELAS CORE
-- =====================================================

-- Inserir dados de categorias (12 registos)
INSERT INTO categories (id, nome, tipo, cor, created_at) VALUES
('90af6284-24bc-4a9e-8eb9-9e6c8e20c2ba', 'Alimentação', 'despesa', '#EF4444', '2025-07-17 16:15:57.74168+00'),
('eb618361-1fa5-4a48-8c77-0d993bbfd420', 'Transporte', 'despesa', '#F97316', '2025-07-17 16:15:57.74168+00'),
('a74e09c8-40d9-4dd3-97be-f7e7a02aaba6', 'Habitação', 'despesa', '#8B5CF6', '2025-07-17 16:15:57.74168+00'),
('8207de44-c502-4f70-bf46-66412fdb352e', 'Saúde', 'despesa', '#10B981', '2025-07-17 16:15:57.74168+00'),
('0a8f1a3a-db1d-4cf7-a277-d353cc4e1240', 'Entretenimento', 'despesa', '#F59E0B', '2025-07-17 16:15:57.74168+00'),
('1fd51833-853d-485f-a524-e887736d18ce', 'Educação', 'despesa', '#3B82F6', '2025-07-17 16:15:57.74168+00'),
('e01dd05d-f300-4f27-8fc5-9bca133f1675', 'Compras', 'despesa', '#EC4899', '2025-07-17 16:15:57.74168+00'),
('1ed97b42-3ac1-40b8-83aa-b3675c72e2c3', 'Outros', 'despesa', '#6B7280', '2025-07-17 16:15:57.74168+00'),
('ee32ee7d-c21b-486b-8810-2fbe7e6ed6d0', 'Salário', 'receita', '#10B981', '2025-07-17 16:15:57.74168+00'),
('95334a49-724d-411f-8485-9d0ae0c5f920', 'Freelance', 'receita', '#059669', '2025-07-17 16:15:57.74168+00'),
('18e52fe8-669c-41fa-a9ba-4f140b893a61', 'Investimentos', 'receita', '#0D9488', '2025-07-17 16:15:57.74168+00'),
('63f61e16-b205-4aa4-a056-342838e3859a', 'Outros', 'receita', '#6366F1', '2025-07-17 16:15:57.74168+00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. DADOS DE EXEMPLO (PARA TESTE/DEMONSTRAÇÃO)
-- =====================================================

-- Exemplo de perfil
INSERT INTO profiles (id, user_id, nome, foto_url, percentual_divisao, poupanca_mensal, created_at, updated_at) VALUES
('25df1459-3e3d-42bd-bdaa-828328c0024b', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 'teste1', null, 50.00, 20.00, '2025-07-17 22:59:44.695471+00', '2025-07-17 22:59:44.695471+00')
ON CONFLICT (user_id) DO NOTHING;

-- Exemplos de transações
INSERT INTO transactions (id, user_id, valor, data, categoria_id, tipo, modo, descricao, created_at) VALUES
('61a75c57-d35e-435e-87cd-ea2d43faed23', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 0.01, '2025-07-17', null, 'receita', 'pessoal', 'Transação de boas-vindas! 🎉', '2025-07-17 22:59:44.950289+00'),
('273ee48e-cdd5-4623-bc80-aee5557c1871', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 1050.00, '2025-07-01', 'ee32ee7d-c21b-486b-8810-2fbe7e6ed6d0', 'receita', 'pessoal', null, '2025-07-17 23:02:56.706909+00'),
('3d81773c-5da0-47a4-a654-53bcb5feffe3', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 580.00, '2025-07-01', 'a74e09c8-40d9-4dd3-97be-f7e7a02aaba6', 'despesa', 'pessoal', null, '2025-07-17 23:03:41.570044+00'),
('286417b3-e472-40e5-bb3c-7b69442d613e', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 200.00, '2025-07-18', '90af6284-24bc-4a9e-8eb9-9e6c8e20c2ba', 'despesa', 'pessoal', null, '2025-07-17 23:04:32.082169+00'),
('4fc55461-6962-48cf-9ddc-a7edf0db317e', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 40.00, '2025-07-18', 'eb618361-1fa5-4a48-8c77-0d993bbfd420', 'despesa', 'pessoal', null, '2025-07-17 23:05:37.21378+00'),
('b1cf90cc-79b1-4952-938f-8b49ccbc5577', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 55.00, '2025-07-12', '8207de44-c502-4f70-bf46-66412fdb352e', 'despesa', 'pessoal', null, '2025-07-17 23:06:11.579029+00')
ON CONFLICT (id) DO NOTHING;

-- Exemplos de objetivos
INSERT INTO goals (id, user_id, nome, valor_meta, valor_atual, prazo, created_at, updated_at) VALUES
('193e3cda-3bed-423e-8708-cfa1e4c2e779', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 'Fundo de Emergência', 10000.00, 0.00, null, '2025-07-17 22:59:44.829298+00', '2025-07-17 22:59:44.829298+00'),
('848aeafa-8d5f-4d57-88d4-b0d7e6af7781', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 'Férias de Verão', 3000.00, 0.00, null, '2025-07-17 22:59:44.829298+00', '2025-07-17 22:59:44.829298+00'),
('2285bab3-11bf-4a6c-be4e-a0a0cc6a3633', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 'Carro Novo', 15000.00, 0.00, null, '2025-07-17 22:59:44.829298+00', '2025-07-17 22:59:44.829298+00'),
('ba4d9e6d-21e4-4ba1-a57b-9c3fffe319c9', '017a5ae9-3ac6-4866-b9e6-e364c9c4ecf6', 'Educação', 5000.00, 0.00, null, '2025-07-17 22:59:44.829298+00', '2025-07-17 22:59:44.829298+00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Categories: acesso público para leitura
DROP POLICY IF EXISTS "Categorias são visíveis para todos" ON categories;
CREATE POLICY "Categorias são visíveis para todos"
    ON categories FOR SELECT
    USING (true);

-- Profiles: só dados próprios
DROP POLICY IF EXISTS "Utilizadores podem ver o próprio perfil" ON profiles;
CREATE POLICY "Utilizadores podem ver o próprio perfil"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizadores podem criar o próprio perfil" ON profiles;
CREATE POLICY "Utilizadores podem criar o próprio perfil"
    ON profiles FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Utilizadores podem atualizar o próprio perfil" ON profiles;
CREATE POLICY "Utilizadores podem atualizar o próprio perfil"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Transactions: só dados próprios
DROP POLICY IF EXISTS "Utilizadores podem ver as próprias transações" ON transactions;
CREATE POLICY "Utilizadores podem ver as próprias transações"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizadores podem criar as próprias transações" ON transactions;
CREATE POLICY "Utilizadores podem criar as próprias transações"
    ON transactions FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Utilizadores podem atualizar as próprias transações" ON transactions;
CREATE POLICY "Utilizadores podem atualizar as próprias transações"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizadores podem eliminar as próprias transações" ON transactions;
CREATE POLICY "Utilizadores podem eliminar as próprias transações"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Goals: só dados próprios
DROP POLICY IF EXISTS "Utilizadores podem ver as próprias metas" ON goals;
CREATE POLICY "Utilizadores podem ver as próprias metas"
    ON goals FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizadores podem criar as próprias metas" ON goals;
CREATE POLICY "Utilizadores podem criar as próprias metas"
    ON goals FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Utilizadores podem atualizar as próprias metas" ON goals;
CREATE POLICY "Utilizadores podem atualizar as próprias metas"
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizadores podem eliminar as próprias metas" ON goals;
CREATE POLICY "Utilizadores podem eliminar as próprias metas"
    ON goals FOR DELETE
    USING (auth.uid() = user_id);

-- Fixed Expenses: só dados próprios
DROP POLICY IF EXISTS "Utilizadores podem ver as próprias despesas fixas" ON fixed_expenses;
CREATE POLICY "Utilizadores podem ver as próprias despesas fixas"
    ON fixed_expenses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizadores podem criar as próprias despesas fixas" ON fixed_expenses;
CREATE POLICY "Utilizadores podem criar as próprias despesas fixas"
    ON fixed_expenses FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Utilizadores podem atualizar as próprias despesas fixas" ON fixed_expenses;
CREATE POLICY "Utilizadores podem atualizar as próprias despesas fixas"
    ON fixed_expenses FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utilizadores podem eliminar as próprias despesas fixas" ON fixed_expenses;
CREATE POLICY "Utilizadores podem eliminar as próprias despesas fixas"
    ON fixed_expenses FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. POLÍTICAS FAMÍLIA (FAMILY SHARING)
-- =====================================================

-- Families
DROP POLICY IF EXISTS "create_families" ON families;
CREATE POLICY "create_families"
    ON families FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "view_families" ON families;
CREATE POLICY "view_families"
    ON families FOR SELECT
    USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM family_members fm 
            WHERE fm.family_id = families.id 
            AND fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "update_families" ON families;
CREATE POLICY "update_families"
    ON families FOR UPDATE
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "delete_families" ON families;
CREATE POLICY "delete_families"
    ON families FOR DELETE
    USING (created_by = auth.uid());

-- Family Members
DROP POLICY IF EXISTS "insert_family_members" ON family_members;
CREATE POLICY "insert_family_members"
    ON family_members FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "view_family_members" ON family_members;
CREATE POLICY "view_family_members"
    ON family_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        ) OR
        family_id IN (
            SELECT fm2.family_id FROM family_members fm2 
            WHERE fm2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "update_family_members" ON family_members;
CREATE POLICY "update_family_members"
    ON family_members FOR UPDATE
    USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "delete_family_members" ON family_members;
CREATE POLICY "delete_family_members"
    ON family_members FOR DELETE
    USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        ) OR 
        user_id = auth.uid()
    );

-- Family Invites
DROP POLICY IF EXISTS "create_family_invites" ON family_invites;
CREATE POLICY "create_family_invites"
    ON family_invites FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "view_family_invites" ON family_invites;
CREATE POLICY "view_family_invites"
    ON family_invites FOR SELECT
    USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        ) OR
        family_id IN (
            SELECT fm.family_id FROM family_members fm 
            WHERE fm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "update_family_invites" ON family_invites;
CREATE POLICY "update_family_invites"
    ON family_invites FOR UPDATE
    USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "delete_family_invites" ON family_invites;
CREATE POLICY "delete_family_invites"
    ON family_invites FOR DELETE
    USING (
        family_id IN (
            SELECT f.id FROM families f 
            WHERE f.created_by = auth.uid()
        )
    );

-- =====================================================
-- 6. ATIVAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_families_updated_at ON families;
CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIM DO BACKUP SQL
-- =====================================================

-- Para restaurar este backup:
-- 1. Criar as tabelas usando family_tables_complete.sql
-- 2. Executar este ficheiro
-- 3. Configurar variáveis de ambiente no cliente
-- 4. Actualizar tipos TypeScript

-- Backup criado em: 2025-01-18
-- Projeto: Meu Dinheiro PT Digital
-- Versão: 1.0 (Versão1)
-- Estado: Aplicação completa e funcional 