import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useOnboardingData(user: any, onComplete: () => void) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    nome: user?.user_metadata?.nome || '',
    percentual_divisao: 50,
    poupanca_mensal: 20
  });
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState({ nome: '', valor_meta: '' });

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
      // Guardar perfil
      setLoading(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            nome: profileData.nome,
            percentual_divisao: profileData.percentual_divisao,
            poupanca_mensal: profileData.poupanca_mensal
          });
        if (error) throw error;
      } catch (error) {
        toast({ title: 'Erro ao guardar perfil', description: String(error), variant: 'destructive' });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (currentStep === 3) {
      // Guardar metas
      setLoading(true);
      try {
        // Exemplo: guardar metas selecionadas e personalizadas
        // ... lógica para inserir metas na tabela 'goals' ...
      } catch (error) {
        toast({ title: 'Erro ao guardar metas', description: String(error), variant: 'destructive' });
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, profileData, user, toast, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  // Outros métodos utilitários podem ser adicionados conforme necessário

  return {
    currentStep,
    setCurrentStep,
    loading,
    profileData,
    setProfileData,
    selectedGoals,
    setSelectedGoals,
    customGoal,
    setCustomGoal,
    handleNext,
    handlePrevious,
    // Adicionar outros métodos conforme necessário
  };
} 