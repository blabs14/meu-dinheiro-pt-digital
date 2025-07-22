// Remover import fixo do supabase
// import { supabase } from '@/integrations/supabase/client';
// import { goalSchema } from '../models/goalSchema'; // Ativar quando necessário

export const fetchGoals = async (supabase: any, filters: any) => {
  let query: any = supabase.from('goals').select('*');
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.familyId) query = query.eq('family_id', filters.familyId);
  if (filters.accountId && filters.accountId !== 'all') query = query.eq('account_id', filters.accountId);
  if (filters.status) query = query.eq('status', filters.status);
  return await query;
};

export const createGoal = async (supabase: any, payload: any) => {
  // TODO: validar com goalSchema
  if (!payload || typeof payload.valor_objetivo !== 'number' || payload.valor_objetivo < 0) {
    return { data: null, error: { message: 'Dados inválidos', details: [{ path: ['valor_objetivo'], message: 'Valor objetivo deve ser positivo' }] } };
  }
  return await (supabase.from('goals') as any).insert(payload).select();
};

export const updateGoalProgress = async (supabase: any, goalId: string, valorAtual: number) => {
  return await (supabase.from('goals') as any).update({ valor_atual: valorAtual }).eq('id', goalId).select();
};

export const deleteGoal = async (supabase: any, goalId: string) => {
  return await (supabase.from('goals') as any).delete().eq('id', goalId);
};

export function makeGoalService(supabase: any) {
  return {
    fetchGoals: (filters: any) => fetchGoals(supabase, filters),
    createGoal: (payload: any) => createGoal(supabase, payload),
    updateGoalProgress: (goalId: string, valorAtual: number) => updateGoalProgress(supabase, goalId, valorAtual),
    deleteGoal: (goalId: string) => deleteGoal(supabase, goalId),
  };
} 