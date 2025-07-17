-- Criar tabela de perfis de utilizador
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  foto_url TEXT,
  percentual_divisao DECIMAL(5,2) DEFAULT 50.00,
  poupanca_mensal DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela de categorias
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('despesa', 'receita')),
  cor TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de transações
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  categoria_id UUID REFERENCES public.categories(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  modo TEXT NOT NULL CHECK (modo IN ('pessoal', 'partilhado')),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de metas de poupança
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  valor_meta DECIMAL(10,2) NOT NULL,
  valor_atual DECIMAL(10,2) DEFAULT 0,
  prazo DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de despesas fixas
CREATE TABLE public.fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  categoria_id UUID REFERENCES public.categories(id),
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Utilizadores podem ver o próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem criar o próprio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem atualizar o próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas RLS para transactions
CREATE POLICY "Utilizadores podem ver as próprias transações" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem criar as próprias transações" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem atualizar as próprias transações" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem eliminar as próprias transações" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para goals
CREATE POLICY "Utilizadores podem ver as próprias metas" 
ON public.goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem criar as próprias metas" 
ON public.goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem atualizar as próprias metas" 
ON public.goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem eliminar as próprias metas" 
ON public.goals FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para fixed_expenses
CREATE POLICY "Utilizadores podem ver as próprias despesas fixas" 
ON public.fixed_expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem criar as próprias despesas fixas" 
ON public.fixed_expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem atualizar as próprias despesas fixas" 
ON public.fixed_expenses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Utilizadores podem eliminar as próprias despesas fixas" 
ON public.fixed_expenses FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para categories (público para leitura)
CREATE POLICY "Categorias são visíveis para todos" 
ON public.categories FOR SELECT 
USING (true);

-- Inserir categorias padrão
INSERT INTO public.categories (nome, tipo, cor) VALUES
('Alimentação', 'despesa', '#EF4444'),
('Transporte', 'despesa', '#F97316'),
('Habitação', 'despesa', '#8B5CF6'),
('Saúde', 'despesa', '#10B981'),
('Entretenimento', 'despesa', '#F59E0B'),
('Educação', 'despesa', '#3B82F6'),
('Compras', 'despesa', '#EC4899'),
('Outros', 'despesa', '#6B7280'),
('Salário', 'receita', '#10B981'),
('Freelance', 'receita', '#059669'),
('Investimentos', 'receita', '#0D9488'),
('Outros', 'receita', '#6366F1');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();