-- ==========================================
-- CORRIGIR ESTRUTURA DA TABELA GOALS
-- ==========================================

-- Verificar estrutura atual
SELECT 'Estrutura Atual da Tabela Goals' as teste;
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
-- ADICIONAR COLUNAS EM FALTA
-- ==========================================

-- Adicionar coluna valor_objetivo se não existir
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS valor_objetivo DECIMAL(10,2) DEFAULT 0;

-- Adicionar coluna valor_atual se não existir
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS valor_atual DECIMAL(10,2) DEFAULT 0;

-- Adicionar coluna prazo se não existir
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS prazo DATE;

-- Adicionar coluna ativa se não existir
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true;

-- ==========================================
-- VERIFICAR APÓS CORREÇÃO
-- ==========================================

-- Verificar estrutura após correção
SELECT 'Estrutura Após Correção' as teste;
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
-- VERIFICAR DADOS EXISTENTES
-- ==========================================

-- Verificar dados existentes
SELECT 'Dados Existentes na Tabela Goals' as teste;
SELECT 
    id,
    user_id,
    nome,
    valor_objetivo,
    valor_atual,
    prazo,
    family_id,
    ativa,
    created_at,
    updated_at
FROM goals
LIMIT 10; 