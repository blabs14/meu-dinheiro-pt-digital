-- ==========================================
-- VERIFICAR ESTRUTURA DA TABELA GOALS
-- ==========================================

-- Verificar estrutura da tabela goals
SELECT 'Estrutura da Tabela Goals' as teste;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- VERIFICAR DADOS EXISTENTES NA TABELA GOALS
-- ==========================================

-- Verificar dados existentes
SELECT 'Dados Existentes na Tabela Goals' as teste;
SELECT 
    id,
    user_id,
    nome,
    valor_objetivo,
    valor_atual,
    data_objetivo,
    family_id,
    created_at,
    updated_at
FROM goals
LIMIT 10;

-- ==========================================
-- VERIFICAR SE EXISTE COLUNA ATIVA
-- ==========================================

-- Verificar se a coluna ativa existe
SELECT 'Verificar Coluna Ativa' as teste;
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND table_schema = 'public'
  AND column_name = 'ativa';

-- ==========================================
-- ADICIONAR COLUNA ATIVA SE NÃO EXISTIR
-- ==========================================

-- Adicionar coluna ativa se não existir
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true;

-- ==========================================
-- VERIFICAR APÓS ADIÇÃO
-- ==========================================

-- Verificar estrutura após adição
SELECT 'Estrutura Após Adição' as teste;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 