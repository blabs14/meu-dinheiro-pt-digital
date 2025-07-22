import { useState, useEffect } from 'react';
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

export function useGoalsData(userId: string | null, familyId: string | null, goalService: any) {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadGoals() {
    if (!userId) return;
    setLoading(true);
    try {
      const filters: any = { userId };
      if (familyId) filters.familyId = familyId;
      const { data, error } = await goalService.fetchGoals(filters);
      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar metas', description: String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, [userId, familyId, goalService]);

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await goalService.deleteGoal(goalId);
      if (error) throw error;
      toast({ title: 'Meta eliminada com sucesso' });
      loadGoals();
    } catch (error) {
      toast({ title: 'Erro ao eliminar meta', description: String(error), variant: 'destructive' });
    }
  };

  const updateGoalAmount = async (goalId: string, newAmount: number) => {
    try {
      const { error } = await goalService.updateGoalProgress(goalId, newAmount);
      if (error) throw error;
      toast({ title: 'Valor atualizado com sucesso' });
      loadGoals();
    } catch (error) {
      toast({ title: 'Erro ao atualizar valor', description: String(error), variant: 'destructive' });
    }
  };

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