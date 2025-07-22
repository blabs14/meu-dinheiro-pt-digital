import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Goal {
  id: string;
  nome: string;
  valor_objetivo: number;
  valor_atual: number;
  valor_meta?: number | null;
  prazo: string | null;
  created_at: string;
  family_id?: string | null;
}

export function useGoalsData(userId: string | null, familyId?: string | null) {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let query = supabase.from('goals').select('*');
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else {
        query = query.is('family_id', null).eq('user_id', userId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar metas', description: String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, familyId, toast]);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
      toast({ title: 'Meta eliminada com sucesso' });
      loadGoals();
    } catch (error) {
      toast({ title: 'Erro ao eliminar meta', description: String(error), variant: 'destructive' });
    }
  }, [loadGoals, toast]);

  const updateGoalAmount = useCallback(async (goalId: string, newAmount: number) => {
    try {
      const { error } = await supabase.from('goals').update({ valor_atual: newAmount }).eq('id', goalId);
      if (error) throw error;
      toast({ title: 'Valor atualizado com sucesso' });
      loadGoals();
    } catch (error) {
      toast({ title: 'Erro ao atualizar valor', description: String(error), variant: 'destructive' });
    }
  }, [loadGoals, toast]);

  // Outros métodos como createGoal, updateGoal, etc. podem ser adicionados conforme necessário

  return {
    goals,
    loading,
    loadGoals,
    deleteGoal,
    updateGoalAmount,
    // Adicionar outros métodos conforme necessário
  };
} 