-- ==========================================
-- VERIFICAR ESTRUTURA REAL DA TABELA GOALS
-- ==========================================

-- Verificar todas as colunas da tabela goals
SELECT 'Estrutura Real da Tabela Goals' as teste;
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

-- Verificar dados existentes na tabela goals
SELECT 'Dados Existentes na Tabela Goals' as teste;
SELECT 
    id,
    user_id,
    nome,
    -- Tentar diferentes nomes de colunas
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'valor_objetivo') 
        THEN 'valor_objetivo existe'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'objetivo') 
        THEN 'objetivo existe'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'target_amount') 
        THEN 'target_amount existe'
        ELSE 'Nenhuma coluna de valor objetivo encontrada'
    END as status_valor_objetivo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'valor_atual') 
        THEN 'valor_atual existe'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'current_amount') 
        THEN 'current_amount existe'
        ELSE 'Nenhuma coluna de valor atual encontrada'
    END as status_valor_atual,
    family_id,
    created_at,
    updated_at
FROM goals
LIMIT 5;

-- ==========================================
-- VERIFICAR SE EXISTEM COLUNAS ALTERNATIVAS
-- ==========================================

-- Verificar todas as colunas que podem ser relacionadas com valores
SELECT 'Colunas Relacionadas com Valores' as teste;
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND table_schema = 'public'
  AND (
    column_name LIKE '%valor%' OR 
    column_name LIKE '%amount%' OR 
    column_name LIKE '%objetivo%' OR 
    column_name LIKE '%target%' OR 
    column_name LIKE '%current%'
  )
ORDER BY column_name; 