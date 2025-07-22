import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface FamilyData {
  id: string;
  nome: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  settings: {
    allow_view_all: boolean;
    allow_add_transactions: boolean;
    require_approval: boolean;
  };
}

export function useFamilyData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<FamilyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFamilyData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    console.log('[useFamilyData] loadFamilyData chamado', { user });
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('created_by', user.id)
        .single();
      console.log('[useFamilyData] resultado do supabase', { data, error });
      if (error) throw error;
      setCurrentFamily(data as FamilyData);
      console.log('[useFamilyData] setCurrentFamily', data);
    } catch (error) {
      toast({ title: 'Erro ao carregar família', description: String(error) });
      console.log('[useFamilyData] erro', error);
    } finally {
      setLoading(false);
      console.log('[useFamilyData] setLoading(false)');
    }
  }, [user, toast]);

  useEffect(() => {
    console.log('[useFamilyData] useEffect montou', { user });
    loadFamilyData();
  }, [loadFamilyData]);

  const updateFamily = useCallback(async (updates: Partial<FamilyData>) => {
    if (!user || !currentFamily) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', currentFamily.id)
        .single();
      if (error) throw error;
      setCurrentFamily(data as FamilyData);
      toast({ title: 'Família atualizada com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar família', description: String(error) });
    } finally {
      setLoading(false);
    }
  }, [user, currentFamily, toast]);

  const deleteFamily = useCallback(async () => {
    if (!user || !currentFamily) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', currentFamily.id);
      if (error) throw error;
      setCurrentFamily(null);
      toast({ title: 'Família removida com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao remover família', description: String(error) });
    } finally {
      setLoading(false);
    }
  }, [user, currentFamily, toast]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFamilyData();
      toast({ title: 'Dados Atualizados', description: 'As informações foram recarregadas com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro no refresh', description: String(error) });
    } finally {
      setRefreshing(false);
    }
  }, [loadFamilyData, toast]);

  return {
    loading,
    currentFamily,
    loadFamilyData,
    updateFamily,
    deleteFamily,
    handleRefresh,
    refreshing,
  };
} 