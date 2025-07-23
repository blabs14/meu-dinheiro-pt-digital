-- ==========================================
-- TESTE FINAL - VERIFICAR TUDO FUNCIONA
-- ==========================================

-- ==========================================
-- ETAPA 1: VERIFICAR ESTRUTURA
-- ==========================================

SELECT 'Verificando Estrutura Final' as teste;
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
-- ETAPA 2: INSERIR META DE TESTE PESSOAL
-- ==========================================

-- Inserir meta pessoal (sem family_id)
INSERT INTO goals (
    user_id,
    nome,
    valor_objetivo,
    valor_atual,
    prazo,
    family_id,
    ativa
) VALUES 
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'Meta Pessoal Teste',
    1000.00,
    500.00,
    CURRENT_DATE + INTERVAL '3 months',
    NULL,
    true
);

-- ==========================================
-- ETAPA 3: INSERIR META DE TESTE FAMILIAR
-- ==========================================

-- Inserir meta familiar (com family_id)
INSERT INTO goals (
    user_id,
    nome,
    valor_objetivo,
    valor_atual,
    prazo,
    family_id,
    ativa
) VALUES 
(
    '9a04bd6f-beae-4ac8-9a99-dff911004e1a',
    'Meta Familiar Teste',
    2000.00,
    1000.00,
    CURRENT_DATE + INTERVAL '6 months',
    '440b2a36-ca1d-406f-8bbe-8b979d3614f9',
    true
);

-- ==========================================
-- ETAPA 4: VERIFICAR METAS PESSOAIS
-- ==========================================

SELECT 'Metas Pessoais (family_id IS NULL)' as teste;
SELECT 
    id,
    nome,
    valor_objetivo,
    valor_atual,
    family_id,
    ativa
FROM goals
WHERE family_id IS NULL
ORDER BY created_at DESC;

-- ==========================================
-- ETAPA 5: VERIFICAR METAS FAMILIARES
-- ==========================================

SELECT 'Metas Familiares (family_id NOT NULL)' as teste;
SELECT 
    id,
    nome,
    valor_objetivo,
    valor_atual,
    family_id,
    ativa
FROM goals
WHERE family_id IS NOT NULL
ORDER BY created_at DESC;

-- ==========================================
-- ETAPA 6: VERIFICAR CONTAGEM DE METAS
-- ==========================================

SELECT 'Contagem de Metas por Tipo' as teste;
SELECT 
    'Pessoais' as tipo,
    COUNT(*) as total
FROM goals
WHERE family_id IS NULL
UNION ALL
SELECT 
    'Familiares' as tipo,
    COUNT(*) as total
FROM goals
WHERE family_id IS NOT NULL;

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================

-- Após executar este script:
-- 1. Deve haver 1 meta pessoal (family_id IS NULL)
-- 2. Deve haver 1 meta familiar (family_id NOT NULL)
-- 3. Na página geral de metas deve aparecer apenas a meta pessoal
-- 4. Na página da família deve aparecer apenas a meta familiar
-- 5. Os cards de estatísticas devem mostrar os valores corretos

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

-- 1. Execute este script no SQL Editor
-- 2. Teste a aplicação na página geral de metas (/goals)
-- 3. Teste a aplicação na página da família (/family)
-- 4. Verifique se o filtro está a funcionar corretamente
-- 5. Confirme que não há erros no console 