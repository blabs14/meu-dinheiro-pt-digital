// Remover import fixo do supabase
// import { supabase } from '@/integrations/supabase/client';
import { goalSchema } from '../models/goalSchema';

export const fetchGoals = async (supabase: any, filters: any) => {
  let query: any = supabase.from('goals').select('*');
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.familyId) {
    query = query.eq('family_id', filters.familyId);
  } else {
    query = query.is('family_id', null); // Só metas pessoais
  }
  if (filters.accountId && filters.accountId !== 'all') query = query.eq('account_id', filters.accountId);
  if (filters.status) query = query.eq('status', filters.status);
  return await query;
};

export const createGoal = async (supabase: any, payload: any) => {
  // Mapear campos do payload para o schema
  const mapped = {
    name: payload.nome,
    targetAmount: payload.valor_objetivo,
    deadline: payload.data_limite,
    userId: payload.user_id,
  };
  const validation = goalSchema.safeParse(mapped);
  if (!validation.success) {
    return {
      data: null,
      error: {
        message: 'Dados inválidos',
        details: validation.error.errors.map(e => ({ path: e.path, message: e.message }))
      }
    };
  }
  return await (supabase.from('goals') as any).insert(payload).select();
};

export const updateGoalProgress = async (supabase: any, goalId: string, valorAtual: number) => {
  return await (supabase.from('goals') as any).update({ valor_atual: valorAtual }).eq('id', goalId).select();
};

export const deleteGoal = async (supabase: any, goalId: string) => {
  return await (supabase.from('goals') as any).delete().eq('id', goalId);
};

export const fetchGoalById = async (supabase: any, id: string) => {
  const { data, error } = await supabase.from('goals').select('*').eq('id', id).single();
  return { data, error };
};

export function makeGoalService(supabase: any) {
  return {
    fetchGoals: (filters: any) => fetchGoals(supabase, filters),
    createGoal: (payload: any) => createGoal(supabase, payload),
    updateGoalProgress: (goalId: string, valorAtual: number) => updateGoalProgress(supabase, goalId, valorAtual),
    deleteGoal: (goalId: string) => deleteGoal(supabase, goalId),
    fetchGoalById: (id: string) => fetchGoalById(supabase, id),
  };
} 