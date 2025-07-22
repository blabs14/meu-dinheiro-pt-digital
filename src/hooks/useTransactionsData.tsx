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

export function useTransactionsData(userId: string | null, familyId?: string | null, accountId?: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentTransactions = useCallback(async () => {
    if (!userId) return;
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

      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else {
        query = query.is('family_id', null);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId, familyId, accountId]);

  return {
    transactions,
    loading,
    loadRecentTransactions,
  };
} 