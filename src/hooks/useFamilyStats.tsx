import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Usar useRef para evitar múltiplas chamadas
  const loadingRef = useRef(false);
  const lastFamilyIdRef = useRef<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!familyId) {
      console.log('🔍 useFamilyStats - Sem familyId, não carregando stats');
      setStats(s => ({ ...s, loading: false, error: 'Family ID não fornecido.' }));
      return;
    }

    // Evitar múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log('🔍 useFamilyStats - Já está a carregar, ignorando chamada');
      return;
    }

    // Evitar recarregar se o familyId não mudou
    if (lastFamilyIdRef.current === familyId) {
      console.log('🔍 useFamilyStats - FamilyId não mudou, mantendo dados atuais');
      return;
    }

    console.log('🔍 useFamilyStats - Iniciando carregamento para familyId:', familyId);
    loadingRef.current = true;
    lastFamilyIdRef.current = familyId;
    
    setStats(s => ({ ...s, loading: true, error: null }));

    try {
      // Verificar autenticação primeiro
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 useFamilyStats - Utilizador autenticado:', user?.id);
      console.log('🔍 useFamilyStats - Erro de autenticação:', authError);

      if (authError) {
        console.error('❌ useFamilyStats - Erro de autenticação:', authError);
        throw authError;
      }

      if (!user) {
        console.error('❌ useFamilyStats - Utilizador não autenticado');
        throw new Error('Utilizador não autenticado');
      }

      // Usar Julho 2025 onde estão as transações reais
      const currentMonth = '2025-07';
      const startDate = `${currentMonth}-01`;
      const endDate = '2025-08-01';

      console.log('🔍 useFamilyStats - Buscando transações para familyId:', familyId, 'entre', startDate, 'e', endDate);

      // Primeiro, verificar se conseguimos aceder à tabela
      const { count: totalCount, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId);

      console.log('🔍 useFamilyStats - Total de transações na família:', totalCount);
      console.log('🔍 useFamilyStats - Erro ao contar:', countError);

      // Agora fazer a query real
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('valor, tipo')
        .eq('family_id', familyId)
        .gte('data', startDate)
        .lt('data', endDate);

      console.log('🔍 useFamilyStats - Resposta da query de transações:', { transactions, transactionsError });
      console.log('🔍 useFamilyStats - Transações encontradas:', transactions?.length || 0);
      console.log('🔍 useFamilyStats - Erro transações:', transactionsError);
      console.log('🔍 useFamilyStats - Dados brutos das transações:', transactions);

      if (transactionsError) {
        console.error('❌ useFamilyStats - Erro na query de transações:', transactionsError);
        throw transactionsError;
      }

      const income = transactions?.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0) || 0;
      const expenses = transactions?.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Number(t.valor), 0) || 0;
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

      console.log('🔍 useFamilyStats - Cálculos detalhados:', {
        income,
        expenses,
        savingsRate,
        receitas: transactions?.filter(t => t.tipo === 'receita').map(t => t.valor),
        despesas: transactions?.filter(t => t.tipo === 'despesa').map(t => t.valor),
        total_transactions: transactions?.length
      });

      // Fetch active goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('id')
        .eq('family_id', familyId);

      console.log('🔍 useFamilyStats - Metas encontradas:', goals?.length || 0);
      console.log('🔍 useFamilyStats - Erro metas:', goalsError);

      if (goalsError) {
        console.error('❌ useFamilyStats - Erro na query de metas:', goalsError);
        throw goalsError;
      }

      const newStats = {
        totalIncome: income,
        totalExpenses: expenses,
        savingsRate: parseFloat(savingsRate.toFixed(2)),
        activeGoals: goals?.length || 0,
        loading: false,
        error: null,
      };

      console.log('🔍 useFamilyStats - Stats finais definidos:', newStats);
      setStats(newStats);

    } catch (error: any) {
      console.error('❌ useFamilyStats - Erro ao carregar estatísticas:', error);
      setStats(s => ({ ...s, loading: false, error: error.message || 'Erro ao carregar estatísticas' }));
    } finally {
      loadingRef.current = false;
    }
  }, [familyId]);

  // Carregar stats apenas uma vez quando familyId mudar
  useEffect(() => {
    if (familyId) {
      console.log('🔍 useFamilyStats - useEffect - Carregando stats para familyId:', familyId);
      loadStats();
    }
  }, [familyId]); // Apenas familyId como dependência

  // Permitir refresh manual
  const refresh = useCallback(async () => {
    console.log('🔄 useFamilyStats - Refresh manual solicitado');
    lastFamilyIdRef.current = null; // Forçar recarregamento
    await loadStats();
  }, [loadStats]);

  return {
    ...stats,
    refresh,
  };
} 