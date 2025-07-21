-- ==========================================
-- VERIFICAR ESTRUTURA FINAL DA TABELA GOALS
-- ==========================================

-- Verificar todas as colunas da tabela goals
SELECT 'Estrutura Final da Tabela Goals' as teste;
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
    -- Verificar se existe valor_meta ou valor_objetivo
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'valor_meta') 
        THEN 'valor_meta existe'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'valor_objetivo') 
        THEN 'valor_objetivo existe'
        ELSE 'Nenhuma coluna de valor encontrada'
    END as status_valor,
    family_id,
    created_at
FROM goals
LIMIT 5;

-- ==========================================
-- VERIFICAR CONSTRAINTS
-- ==========================================

-- Verificar constraints da tabela goals
SELECT 'Constraints da Tabela Goals' as teste;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'goals'::regclass; 