import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  PiggyBank, 
  Target, 
  CreditCard, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Euro,
  Home,
  Car,
  Plane,
  GraduationCap
} from 'lucide-react';
import { useOnboardingData } from '@/hooks/useOnboardingData';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Substituir estados e funções de onboarding pelo hook
  const {
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
  } = useOnboardingData(user, onComplete);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Meu Dinheiro!',
      description: 'Vamos configurar a sua conta em alguns passos simples',
      icon: <TrendingUp className="h-8 w-8" />
    },
    {
      id: 'profile',
      title: 'Perfil Pessoal',
      description: 'Configure as suas informações básicas',
      icon: <User className="h-8 w-8" />
    },
    {
      id: 'savings',
      title: 'Meta de Poupança',
      description: 'Defina a sua taxa de poupança mensal',
      icon: <PiggyBank className="h-8 w-8" />
    },
    {
      id: 'goals',
      title: 'Objetivos Financeiros',
      description: 'Escolha as suas metas principais',
      icon: <Target className="h-8 w-8" />
    },
    {
      id: 'complete',
      title: 'Pronto!',
      description: 'A sua conta está configurada',
      icon: <CheckCircle className="h-8 w-8" />
    }
  ];

  const predefinedGoals = [
    { id: 'emergency', name: 'Fundo de Emergência', amount: 10000, icon: <Home className="h-5 w-5" /> },
    { id: 'vacation', name: 'Férias de Verão', amount: 3000, icon: <Plane className="h-5 w-5" /> },
    { id: 'car', name: 'Carro Novo', amount: 15000, icon: <Car className="h-5 w-5" /> },
    { id: 'education', name: 'Educação', amount: 5000, icon: <GraduationCap className="h-5 w-5" /> }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Euro className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Olá, {user?.user_metadata?.nome || user?.email}!
              </h2>
              <p className="text-muted-foreground">
                Vamos configurar a sua experiência financeira personalizada em apenas alguns passos.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2">O que vamos configurar:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Perfil pessoal e preferências</li>
                <li>✓ Meta de poupança mensal</li>
                <li>✓ Objetivos financeiros</li>
                <li>✓ Primeira transação de exemplo</li>
              </ul>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={profileData.nome}
                  onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                  placeholder="Como gostaria de ser chamado?"
                />
              </div>

              <div>
                <Label htmlFor="divisao">Divisão de Despesas (%)</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="divisao"
                    type="number"
                    min="0"
                    max="100"
                    value={profileData.percentual_divisao}
                    onChange={(e) => setProfileData({ ...profileData, percentual_divisao: parseInt(e.target.value) || 50 })}
                  />
                  <span className="text-sm text-muted-foreground">
                    Se partilha despesas, que percentagem paga?
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Dica: Divisão de Despesas
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Se vive sozinho, deixe em 100%. Se partilha casa/despesas com alguém, ajuste conforme a sua contribuição (ex: 50% se divide meio a meio).
              </p>
            </div>
          </div>
        );

      case 'savings':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="poupanca">Meta de Poupança Mensal (%)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Input
                  id="poupanca"
                  type="number"
                  min="0"
                  max="100"
                  value={profileData.poupanca_mensal}
                  onChange={(e) => setProfileData({ ...profileData, poupanca_mensal: parseInt(e.target.value) || 20 })}
                />
                <span className="text-2xl font-bold text-primary">
                  {profileData.poupanca_mensal}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`cursor-pointer transition-all ${profileData.poupanca_mensal === 10 ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4 text-center" onClick={() => setProfileData({ ...profileData, poupanca_mensal: 10 })}>
                  <div className="text-2xl font-bold text-orange-500">10%</div>
                  <div className="text-sm text-muted-foreground">Conservador</div>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer transition-all ${profileData.poupanca_mensal === 20 ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4 text-center" onClick={() => setProfileData({ ...profileData, poupanca_mensal: 20 })}>
                  <div className="text-2xl font-bold text-blue-500">20%</div>
                  <div className="text-sm text-muted-foreground">Recomendado</div>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer transition-all ${profileData.poupanca_mensal === 30 ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4 text-center" onClick={() => setProfileData({ ...profileData, poupanca_mensal: 30 })}>
                  <div className="text-2xl font-bold text-green-500">30%</div>
                  <div className="text-sm text-muted-foreground">Ambicioso</div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                📊 Regra dos Especialistas
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Especialistas recomendam poupar pelo menos 20% do rendimento. Começar com 10% é aceitável, mas 30% acelera muito os seus objetivos!
              </p>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Escolha as suas metas principais:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predefinedGoals.map((goal) => (
                  <Card 
                    key={goal.id}
                    className={`cursor-pointer transition-all ${
                      selectedGoals.includes(goal.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {goal.icon}
                          </div>
                          <div>
                            <div className="font-medium">{goal.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(goal.amount)}
                            </div>
                          </div>
                        </div>
                        {selectedGoals.includes(goal.id) && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Ou crie uma meta personalizada:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-name">Nome da Meta</Label>
                  <Input
                    id="custom-name"
                    value={customGoal.nome}
                    onChange={(e) => setCustomGoal({ ...customGoal, nome: e.target.value })}
                    placeholder="Ex: Casa Nova, Mota, Investimento..."
                  />
                </div>
                <div>
                  <Label htmlFor="custom-amount">Valor (€)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    value={customGoal.valor_meta}
                    onChange={(e) => setCustomGoal({ ...customGoal, valor_meta: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                🎯 Poder das Metas
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Pessoas com metas escritas têm 42% mais probabilidade de as atingir. Pode sempre adicionar mais metas depois!
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Tudo Pronto! 🎉
              </h2>
              <p className="text-muted-foreground">
                A sua conta está configurada e pronta para usar.
              </p>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2">O que configurou:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Perfil: {profileData.nome}</li>
                <li>✓ Meta de poupança: {profileData.poupanca_mensal}% mensal</li>
                <li>✓ {selectedGoals.length + (customGoal.nome ? 1 : 0)} metas definidas</li>
                <li>✓ Conta pronta para primeiras transações</li>
              </ul>
            </div>

            <Button onClick={onComplete} className="w-full">
              Começar a usar o Meu Dinheiro
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'profile':
        return profileData.nome.trim().length > 0;
      case 'savings':
        return profileData.poupanca_mensal >= 0;
      case 'goals':
        return selectedGoals.length > 0 || (customGoal.nome && customGoal.valor_meta);
      default:
        return true;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">
              Passo {currentStep + 1} de {steps.length}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}% concluído
            </div>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {steps[currentStep].icon}
            </div>
            <div>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}

          {currentStep < steps.length - 1 && (
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
              >
                {loading ? 'A guardar...' : (
                  currentStep === steps.length - 2 ? 'Finalizar' : 'Próximo'
                )}
                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 