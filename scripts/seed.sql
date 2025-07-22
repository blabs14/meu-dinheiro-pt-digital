-- Seed de exemplo para ambiente de desenvolvimento/teste

-- Utilizadores
INSERT INTO users (id, email, nome) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com', 'Alice'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com', 'Bob');

-- Contas bancárias
INSERT INTO accounts (id, user_id, nome) VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Conta Principal Alice'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Conta Poupança Bob');

-- Categorias
INSERT INTO categories (id, user_id, nome, tipo) VALUES
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Alimentação', 'despesa'),
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Salário', 'receita');

-- Famílias
INSERT INTO families (id, nome, created_by) VALUES
  ('77777777-7777-7777-7777-777777777777', 'Família Exemplo', '11111111-1111-1111-1111-111111111111');

-- Membros da família
INSERT INTO family_members (family_id, user_id, role) VALUES
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'member');

-- Transações
INSERT INTO transactions (id, user_id, valor, tipo, categoria_id, data, descricao, account_id, family_id) VALUES
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 1200, 'receita', '66666666-6666-6666-6666-666666666666', '2024-07-01', 'Salário de Julho', '33333333-3333-3333-3333-333333333333', NULL),
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 50, 'despesa', '55555555-5555-5555-5555-555555555555', '2024-07-02', 'Supermercado', '33333333-3333-3333-3333-333333333333', NULL);

-- Metas
INSERT INTO goals (id, user_id, nome, valor_objetivo, valor_atual, data_limite, descricao, account_id, family_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Poupar para férias', 1000, 200, '2024-12-31', 'Meta para férias de verão', '33333333-3333-3333-3333-333333333333', NULL); 