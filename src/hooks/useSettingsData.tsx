import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfileData {
  nome: string;
  email: string;
  percentual_divisao: number;
  poupanca_mensal: number;
}

export function useSettingsData(user: any) {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData>({
    nome: '',
    email: user?.email || '',
    percentual_divisao: 50,
    poupanca_mensal: 20
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('nome, percentual_divisao, poupanca_mensal')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (profile) {
        setProfileData({
          nome: profile.nome || '',
          email: user.email || '',
          percentual_divisao: profile.percentual_divisao || 50,
          poupanca_mensal: profile.poupanca_mensal || 20
        });
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar perfil', description: String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateProfile = useCallback(async (newProfile: ProfileData) => {
    if (!user) return;
    setLoading(true);
    try {
      // Atualizar metadados do auth se o nome mudou
      if (newProfile.nome !== user.user_metadata?.nome) {
        const { error: authError } = await supabase.auth.updateUser({ data: { nome: newProfile.nome } });
        if (authError) throw authError;
      }
      // Atualizar perfil na base de dados
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          nome: newProfile.nome,
          percentual_divisao: newProfile.percentual_divisao,
          poupanca_mensal: newProfile.poupanca_mensal
        });
      if (profileError) throw profileError;
      setProfileData(newProfile);
      toast({ title: 'Perfil atualizado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar perfil', description: String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Métodos para password e eliminação de conta podem ser adicionados conforme necessário

  return {
    profileData,
    setProfileData,
    loading,
    passwordLoading,
    loadProfile,
    updateProfile,
    // Adicionar outros métodos conforme necessário
  };
} 