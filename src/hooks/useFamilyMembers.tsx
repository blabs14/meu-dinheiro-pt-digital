import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FamilyData } from './useFamilyData';

export interface FamilyMember {
  id: string;
  user_id: string;
  family_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joined_at: string;
  profiles?: {
    nome: string;
    email?: string;
  };
}

export function useFamilyMembers(familyId: string | null, familyService: any) {
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadFamilyMembers = useCallback(async () => {
    if (!familyId) {
      console.log('🔍 useFamilyMembers - Sem familyId, não carregando membros');
      return;
    }
    
    console.log('🔍 useFamilyMembers - Iniciando carregamento para familyId:', familyId);
    setLoadingMembers(true);
    
    try {
      const { data, error } = await familyService.fetchFamilyMembers(familyId);
      console.log('🔍 useFamilyMembers - Resposta do service:', { data, error });
      
      if (error) throw error;
      
      console.log('🔍 useFamilyMembers - Membros carregados:', data?.length || 0);
      console.log('🔍 useFamilyMembers - Dados dos membros:', data);
      setFamilyMembers(data || []);
      
    } catch (error) {
      console.error('❌ useFamilyMembers - Erro:', error);
      toast({ title: 'Erro ao carregar membros', description: String(error) });
    } finally {
      setLoadingMembers(false);
    }
  }, [familyId, familyService, toast]);

  // Carregar membros automaticamente quando familyId mudar
  useEffect(() => {
    if (familyId) {
      console.log('🔍 useFamilyMembers - useEffect - Carregando membros para familyId:', familyId);
      loadFamilyMembers();
    }
  }, [familyId, loadFamilyMembers]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!familyId) return;
    setLoadingMembers(true);
    try {
      const { error } = await familyService.removeMember(familyId, memberId);
      if (error) throw error;
      setFamilyMembers(members => members.filter(m => m.id !== memberId));
      toast({ title: 'Membro removido com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao remover membro', description: String(error) });
    } finally {
      setLoadingMembers(false);
    }
  }, [familyId, familyService, toast]);

  const updateMemberRole = useCallback(async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!familyId) return;
    setLoadingMembers(true);
    try {
      const { error } = await familyService.updateMemberRole(familyId, memberId, newRole);
      if (error) throw error;
      setFamilyMembers(members => members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast({ title: 'Permissão atualizada com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar permissão', description: String(error) });
    } finally {
      setLoadingMembers(false);
    }
  }, [familyId, familyService, toast]);

  return {
    familyMembers,
    loadingMembers,
    loadFamilyMembers,
    removeMember,
    updateMemberRole,
  };
} 