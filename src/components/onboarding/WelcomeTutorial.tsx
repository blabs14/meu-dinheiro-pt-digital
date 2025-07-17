import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  Plus, 
  Target, 
  PieChart, 
  CreditCard,
  CheckCircle,
  X,
  ArrowRight,
  Euro,
  Calendar,
  BarChart3
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
}

interface WelcomeTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WelcomeTutorial = ({ open, onOpenChange }: WelcomeTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo! 🎉',
      description: 'A sua conta está configurada! Vamos dar uma volta rápida pelas funcionalidades principais.',
      icon: <CheckCircle className="h-6 w-6" />
    },
    {
      id: 'add-transaction',
      title: 'Adicionar Transações',
      description: 'Use os botões "Nova Despesa" e "Nova Receita" para registar as suas movimentações financeiras.',
      icon: <Plus className="h-6 w-6" />,
      action: 'Clique nos botões no dashboard'
    },
    {
      id: 'view-charts',
      title: 'Visualizar Gráficos',
      description: 'Acompanhe a evolução das suas finanças com gráficos de categorias, tendências mensais e progresso de poupança.',
      icon: <PieChart className="h-6 w-6" />,
      action: 'Visíveis automaticamente com dados'
    },
    {
      id: 'manage-goals',
      title: 'Gerir Metas',
      description: 'Acompanhe o progresso das suas metas de poupança e adicione novas na secção "Metas".',
      icon: <Target className="h-6 w-6" />,
      action: 'Clique no tab "Metas"'
    },
    {
      id: 'track-progress',
      title: 'Acompanhar Progresso',
      description: 'Use os botões rápidos (+50€, +100€, +200€) nas metas para atualizar o progresso facilmente.',
      icon: <TrendingUp className="h-6 w-6" />,
      action: 'Botões nas cartas de metas'
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const quickTips = [
    {
      icon: <Euro className="h-5 w-5 text-income" />,
      title: 'Registe Transações Regularmente',
      description: 'Adicione receitas e despesas assim que acontecem para manter controlo total.'
    },
    {
      icon: <Target className="h-5 w-5 text-primary" />,
      title: 'Defina Metas Realistas',
      description: 'Comece com metas pequenas e aumente gradualmente conforme ganha confiança.'
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-savings" />,
      title: 'Analise os Gráficos',
      description: 'Use os gráficos para identificar padrões de gastos e áreas de melhoria.'
    },
    {
      icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
      title: 'Revise Mensalmente',
      description: 'Faça uma revisão mensal para ajustar metas e analisar o progresso.'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {currentStep + 1} de {tutorialSteps.length}
              </Badge>
              <DialogTitle>Tutorial Rápido</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Aprenda a usar as funcionalidades principais do Meu Dinheiro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Passo atual */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {tutorialSteps[currentStep].icon}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {tutorialSteps[currentStep].title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tutorialSteps[currentStep].description}
                  </p>
                </div>
              </div>
            </CardHeader>
            {tutorialSteps[currentStep].action && (
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Como fazer:</strong> {tutorialSteps[currentStep].action}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Dicas rápidas - mostrar apenas no último passo */}
          {currentStep === tutorialSteps.length - 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Dicas para o Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickTips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mt-1">
                        {tip.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{tip.title}</h4>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navegação */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>

            <div className="flex space-x-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext}>
              {currentStep === tutorialSteps.length - 1 ? 'Começar' : 'Próximo'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Botão para saltar */}
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Saltar tutorial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 