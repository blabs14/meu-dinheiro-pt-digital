import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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

export function useFamilyData(userId: string | null, familyService: any) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<FamilyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFamilyData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await familyService.fetchFamilies(userId);
      if (error) throw error;
      // Supondo que fetchFamilies devolve array, pegar a primeira família do utilizador
      setCurrentFamily(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      toast({ title: 'Erro ao carregar família', description: String(error) });
    } finally {
      setLoading(false);
    }
  }, [userId, familyService, toast]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const updateFamily = useCallback(async (updates: Partial<FamilyData>) => {
    if (!userId || !currentFamily) return;
    setLoading(true);
    try {
      const { data, error } = await familyService.updateFamily(currentFamily.id, updates);
      if (error) throw error;
      setCurrentFamily(data ? (Array.isArray(data) ? data[0] : data) : null);
      toast({ title: 'Família atualizada com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar família', description: String(error) });
    } finally {
      setLoading(false);
    }
  }, [userId, currentFamily, familyService, toast]);

  const deleteFamily = useCallback(async () => {
    if (!userId || !currentFamily) return;
    setLoading(true);
    try {
      const { error } = await familyService.removeMember(currentFamily.id, userId);
      if (error) throw error;
      setCurrentFamily(null);
      toast({ title: 'Família removida com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao remover família', description: String(error) });
    } finally {
      setLoading(false);
    }
  }, [userId, currentFamily, familyService, toast]);

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