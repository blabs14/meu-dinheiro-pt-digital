import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export function useFamilyMembers(familyId: string | null) {
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadFamilyMembers = useCallback(async () => {
    if (!familyId) return;
    setLoadingMembers(true);
    try {
      // Tentar função SQL primeiro
      const { data: membersData, error: membersError } = await supabase
        .rpc('get_family_members_with_profiles', { p_family_id: familyId });

      if (membersError) {
        // Fallback: Query direta simples sem relacionamentos
        const { data: directMembers, error: directError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyId);
        if (directError) throw directError;
        // Mapear para o formato esperado
        const processedMembers = (directMembers || []).map((member: any) => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member' | 'viewer',
          profiles: { nome: 'Utilizador', email: '' }
        }));
        setFamilyMembers(processedMembers);
      } else if (Array.isArray(membersData)) {
        const processedMembers = membersData.map((member: any) => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member' | 'viewer',
          profiles: member.profiles || { nome: 'Utilizador', email: '' }
        }));
        setFamilyMembers(processedMembers);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar membros', description: String(error) });
    } finally {
      setLoadingMembers(false);
    }
  }, [familyId, toast]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!familyId) return;
    setLoadingMembers(true);
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)
        .eq('family_id', familyId);
      if (error) throw error;
      setFamilyMembers(members => members.filter(m => m.id !== memberId));
      toast({ title: 'Membro removido com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao remover membro', description: String(error) });
    } finally {
      setLoadingMembers(false);
    }
  }, [familyId, toast]);

  const updateMemberRole = useCallback(async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!familyId) return;
    setLoadingMembers(true);
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('family_id', familyId);
      if (error) throw error;
      setFamilyMembers(members => members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast({ title: 'Permissão atualizada com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar permissão', description: String(error) });
    } finally {
      setLoadingMembers(false);
    }
  }, [familyId, toast]);

  return {
    familyMembers,
    loadingMembers,
    loadFamilyMembers,
    removeMember,
    updateMemberRole,
  };
} 