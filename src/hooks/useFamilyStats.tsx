import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FamilyStats {
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  activeGoals: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFamilyStats(familyId: string | null): FamilyStats {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    savingsRate: 0,
    activeGoals: 0,
    loading: false,
    error: null as string | null,
  });

  const loadStats = useCallback(async () => {
    if (!familyId) return;
    setStats(s => ({ ...s, loading: true, error: null }));
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('valor, tipo')
        .eq('family_id', familyId)
        .gte('data', `${currentMonth}-01`)
        .lt('data', `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10)}`);
      if (transactionsError) throw transactionsError;
      const income = transactions?.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0) || 0;
      const expenses = transactions?.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Number(t.valor), 0) || 0;
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('id')
        .eq('family_id', familyId);
      if (goalsError) throw goalsError;
      setStats(s => ({
        ...s,
        totalIncome: income,
        totalExpenses: expenses,
        savingsRate,
        activeGoals: goals?.length || 0,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      setStats(s => ({ ...s, loading: false, error: error.message || 'Erro ao carregar estatísticas' }));
    }
  }, [familyId]);

  // Permitir refresh manual
  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  return {
    ...stats,
    refresh,
  };
} 