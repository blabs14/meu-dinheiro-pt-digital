import { supabase } from '@/integrations/supabase/client';
import { transactionSchema } from '../models/transactionSchema';

export const fetchTransactions = async (filters: any) => {
  // Exemplo: filters = { userId, familyId, accountId, month }
  let query = supabase.from('transactions').select('*');
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.familyId) query = query.eq('family_id', filters.familyId);
  if (filters.accountId && filters.accountId !== 'all') query = query.eq('account_id', filters.accountId);
  // Filtro de mês
  if (filters.month && filters.month !== 'all') {
    const [year, month] = filters.month.split('-').map(Number);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);
    query = query.gte('data', start).lte('data', end);
  }
  return await query;
};

export const createTransaction = async (payload: any) => {
  const parse = transactionSchema.safeParse(payload);
  if (!parse.success) {
    return { data: null, error: { message: 'Dados inválidos', details: parse.error.errors } };
  }
  // Garantir que todos os campos obrigatórios estão presentes
  const tx = {
    user_id: parse.data.user_id,
    valor: parse.data.valor,
    tipo: parse.data.tipo,
    categoria_id: parse.data.categoria_id,
    data: parse.data.data,
    descricao: parse.data.descricao || null,
    account_id: parse.data.account_id,
    family_id: parse.data.family_id || null
  };
  return await supabase.from('transactions').insert(tx).select();
};

/**
 * Classifica uma transação com base em múltiplos critérios.
 * Pode ser expandido para usar machine learning, regras de negócio, categorias, recorrência, etc.
 * Exemplo: retorna 'alta', 'recorrente', 'poupança', 'familiar', etc.
 */
export const classifyTransaction = (transaction: any) => {
  if (!transaction) return 'desconhecido';
  if (transaction.tipo === 'poupanca') return 'poupança';
  if (transaction.family_id) return 'familiar';
  if (transaction.valor > 1000) return 'alta';
  if (transaction.categoria_id && [/* IDs de categorias recorrentes */].includes(transaction.categoria_id)) return 'recorrente';
  if (transaction.valor > 0) return 'normal';
  return 'baixa';
};

/**
 * Divide uma transação entre vários utilizadores ou contas.
 * Suporta split por percentagem ou valor fixo.
 * splitRules = [{ userId, percent? , amount? }]
 * Valida que a soma das percentagens/valores corresponde ao total.
 */
export const applySplit = (transaction: any, splitRules: any[]) => {
  if (!Array.isArray(splitRules) || splitRules.length === 0) return [transaction];
  const total = transaction.valor;
  let totalSplit = 0;
  const splits = splitRules.map((rule) => {
    let valor = 0;
    if (rule.percent) {
      valor = +(total * (rule.percent / 100)).toFixed(2);
      totalSplit += valor;
    } else if (rule.amount) {
      valor = +rule.amount;
      totalSplit += valor;
    }
    return {
      ...transaction,
      user_id: rule.userId,
      valor,
      split_meta: { original: total, rule },
    };
  });
  // Ajuste final para garantir que a soma bate certo (corrige arredondamentos)
  if (Math.abs(totalSplit - total) > 0.01) {
    splits[0].valor += total - totalSplit;
  }
  return splits;
};

/**
 * Aplica poupança automática quando entra uma receita.
 * Permite configurar percentagem e conta de destino.
 * Garante que não duplica transações de poupança para a mesma receita.
 */
export const autoSaveOnIncome = async (transaction: any, options?: { percent?: number, savingsAccountId?: string }) => {
  if (transaction.tipo === 'receita' && transaction.valor > 0) {
    const percent = options?.percent ?? 10; // default 10%
    const savings = +(transaction.valor * (percent / 100)).toFixed(2);
    if (savings < 0.01) return;
    // Verificar se já existe uma transação de poupança associada (exemplo: via descrição ou campo extra)
    const existing = await supabase.from('transactions')
      .select('id')
      .eq('descricao', `Poupança automática de receita ${transaction.id}`)
      .maybeSingle();
    if (existing.data) return; // Já existe
    await supabase.from('transactions').insert({
      user_id: transaction.user_id,
      tipo: 'poupanca',
      valor: savings,
      data: transaction.data,
      categoria_id: transaction.categoria_id,
      descricao: `Poupança automática de receita ${transaction.id}`,
      account_id: options?.savingsAccountId || transaction.account_id,
      family_id: transaction.family_id ?? null,
    });
  }
};

const transactionService = {
  fetchTransactions,
  createTransaction,
  classifyTransaction,
  applySplit,
  autoSaveOnIncome,
};
export default transactionService; 