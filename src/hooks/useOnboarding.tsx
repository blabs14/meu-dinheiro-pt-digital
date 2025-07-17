import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    } else {
      setNeedsOnboarding(null);
      setLoading(false);
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Verificar se o perfil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('user_id', user.id)
        .single();

      // Se não tem perfil ou perfil está incompleto, precisa de onboarding
      if (profileError || !profile || !profile.nome) {
        setNeedsOnboarding(true);
        return;
      }

      // Verificar se tem pelo menos uma transação ou meta
      const [
        { data: transactions, error: transError },
        { data: goals, error: goalsError }
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1),
        supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
      ]);

      // Se não tem transações nem metas, ainda precisa de setup
      const hasActivity = (transactions && transactions.length > 0) || (goals && goals.length > 0);
      
      setNeedsOnboarding(!hasActivity);

    } catch (error) {
      console.error('Erro ao verificar status de onboarding:', error);
      // Em caso de erro, assumir que não precisa de onboarding
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
    recheckOnboarding: checkOnboardingStatus
  };
}; 