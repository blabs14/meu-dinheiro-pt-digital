-- Verificar transações e seus family_id
SELECT 
    id,
    user_id,
    valor,
    tipo,
    data,
    descricao,
    family_id,
    created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 20;

-- Contar transações por tipo de family_id
SELECT 
    CASE 
        WHEN family_id IS NULL THEN 'Pessoais'
        ELSE 'Familiares'
    END as tipo_transacao,
    COUNT(*) as total,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas
FROM transactions 
GROUP BY 
    CASE 
        WHEN family_id IS NULL THEN 'Pessoais'
        ELSE 'Familiares'
    END;

-- Verificar se há transações com family_id incorreto
SELECT 
    'Transações pessoais com family_id' as problema,
    COUNT(*) as total
FROM transactions 
WHERE family_id IS NOT NULL 
AND family_id NOT IN (SELECT id FROM families);

-- Verificar transações do mês atual
SELECT 
    CASE 
        WHEN family_id IS NULL THEN 'Pessoais'
        ELSE 'Familiares'
    END as tipo,
    COUNT(*) as total_transacoes,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesas
FROM transactions 
WHERE data >= '2025-01-01' 
AND data < '2025-02-01'
GROUP BY 
    CASE 
        WHEN family_id IS NULL THEN 'Pessoais'
        ELSE 'Familiares'
    END; 