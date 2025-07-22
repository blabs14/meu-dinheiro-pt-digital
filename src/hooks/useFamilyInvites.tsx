import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FamilyInvite {
  id: string;
  family_id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string;
  created_at: string;
  expires_at: string;
}

export function useFamilyInvites(familyId: string | null, userEmail: string | null) {
  const { toast } = useToast();
  const [pendingInvites, setPendingInvites] = useState<FamilyInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const loadFamilyInvites = useCallback(async () => {
    if (!familyId) return;
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString());
      if (error) throw error;
      setPendingInvites((data || []).map((invite: any) => ({
        ...invite,
        status: invite.status as 'pending' | 'accepted' | 'declined',
      })));
    } catch (error) {
      toast({ title: 'Erro ao carregar convites', description: String(error) });
    } finally {
      setLoadingInvites(false);
    }
  }, [familyId, toast]);

  const loadUserPendingInvites = useCallback(async () => {
    if (!userEmail) return;
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('email', userEmail.toLowerCase())
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPendingInvites((data || []).map((invite: any) => ({
        ...invite,
        status: invite.status as 'pending' | 'accepted' | 'declined',
      })));
    } catch (error) {
      toast({ title: 'Erro ao carregar convites do utilizador', description: String(error) });
    } finally {
      setLoadingInvites(false);
    }
  }, [userEmail, toast]);

  const inviteMember = useCallback(async (email: string, role: string) => {
    if (!familyId) return;
    setLoadingInvites(true);
    try {
      const { error } = await supabase
        .from('family_invites')
        .insert({ family_id: familyId, email, role, status: 'pending', invited_by: null, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
      if (error) throw error;
      toast({ title: 'Convite enviado com sucesso' });
      await loadFamilyInvites();
    } catch (error) {
      toast({ title: 'Erro ao enviar convite', description: String(error) });
    } finally {
      setLoadingInvites(false);
    }
  }, [familyId, loadFamilyInvites, toast]);

  const acceptInvite = useCallback(async (inviteId: string) => {
    setLoadingInvites(true);
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
      if (error) throw error;
      toast({ title: 'Convite aceite com sucesso' });
      await loadUserPendingInvites();
    } catch (error) {
      toast({ title: 'Erro ao aceitar convite', description: String(error) });
    } finally {
      setLoadingInvites(false);
    }
  }, [loadUserPendingInvites, toast]);

  const declineInvite = useCallback(async (inviteId: string) => {
    setLoadingInvites(true);
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);
      if (error) throw error;
      toast({ title: 'Convite recusado' });
      await loadUserPendingInvites();
    } catch (error) {
      toast({ title: 'Erro ao recusar convite', description: String(error) });
    } finally {
      setLoadingInvites(false);
    }
  }, [loadUserPendingInvites, toast]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    setLoadingInvites(true);
    try {
      const { error } = await supabase
        .from('family_invites')
        .delete()
        .eq('id', inviteId);
      if (error) throw error;
      toast({ title: 'Convite cancelado' });
      await loadFamilyInvites();
    } catch (error) {
      toast({ title: 'Erro ao cancelar convite', description: String(error) });
    } finally {
      setLoadingInvites(false);
    }
  }, [loadFamilyInvites, toast]);

  return {
    pendingInvites,
    loadingInvites,
    loadFamilyInvites,
    loadUserPendingInvites,
    inviteMember,
    acceptInvite,
    declineInvite,
    cancelInvite,
  };
} 