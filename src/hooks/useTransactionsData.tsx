import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  valor: number;
  data: string;
  tipo: string;
  descricao: string | null;
  family_id?: string | null;
  user_id?: string;
  created_at?: string;
  categories?: {
    nome: string;
    cor: string;
  } | null;
}

export function useTransactionsData(
  userId: string | null, 
  familyId?: string | null, 
  accountId?: string | null,
  selectedMonth?: string
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentTransactions = useCallback(async () => {
    if (!userId) return;
    
    // Verificação de segurança
    if (typeof window === 'undefined') return;
    
    setLoading(true);
    try {
      let query = supabase.from('transactions').select(`
        id,
        valor,
        data,
        tipo,
        descricao,
        family_id,
        user_id,
        created_at,
        categories:categoria_id (
          nome,
          cor
        )
      `)
      .eq('user_id', userId)
      .order('data', { ascending: false });

      // Aplicar filtro de mês baseado no selectedMonth
      if (selectedMonth === 'current') {
        // Mês atual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const startDate = firstDayOfMonth.toISOString().split('T')[0];
        const endDate = lastDayOfMonth.toISOString().split('T')[0];
        
        console.log('🔍 [useTransactionsData] Buscando transações do mês atual:', { startDate, endDate });
        
        query = query.gte('data', startDate).lte('data', endDate);
      } else if (selectedMonth && selectedMonth !== 'all') {
        // Mês específico (formato: YYYY-MM)
        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);
        
        const startDate = firstDayOfMonth.toISOString().split('T')[0];
        const endDate = lastDayOfMonth.toISOString().split('T')[0];
        
        console.log('🔍 [useTransactionsData] Buscando transações do mês específico:', { selectedMonth, startDate, endDate });
        
        query = query.gte('data', startDate).lte('data', endDate);
      } else {
        // Todos os meses - limitar a 25 transações
        console.log('🔍 [useTransactionsData] Buscando últimas 25 transações (todos os meses)');
        query = query.limit(25);
      }

      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else {
        query = query.is('family_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      console.log('🔍 [useTransactionsData] Transações encontradas:', data?.length || 0);
      setTransactions(data || []);
    } catch (error) {
      console.error('❌ [useTransactionsData] Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId, familyId, accountId, selectedMonth]);

  return {
    transactions,
    loading,
    loadRecentTransactions,
  };
} 