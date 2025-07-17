import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GoalForm } from './GoalForm';
import { GoalCard } from './GoalCard';
import { Target, Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface Goal {
  id: string;
  nome: string;
  valor_meta: number;
  valor_atual: number;
  prazo: string | null;
  created_at: string;
}

interface GoalsManagerProps {
  refreshTrigger?: number;
}

export const GoalsManager = ({ refreshTrigger }: GoalsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user, refreshTrigger]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar metas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Meta eliminada com sucesso",
      });

      loadGoals();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao eliminar meta",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAmount = async (goalId: string, newAmount: number) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ valor_atual: newAmount })
        .eq('id', goalId);

      if (error) throw error;

      // Check if goal was completed
      const goal = goals.find(g => g.id === goalId);
      if (goal && newAmount >= goal.valor_meta && goal.valor_atual < goal.valor_meta) {
        toast({
          title: "🎉 Parabéns!",
          description: `Meta "${goal.nome}" foi atingida!`,
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Valor atualizado com sucesso",
        });
      }

      loadGoals();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar valor",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingGoal(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Estatísticas
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.valor_atual >= g.valor_meta).length;
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.valor_meta, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.valor_atual, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">A carregar metas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Metas de Poupança
            </h1>
            <p className="text-muted-foreground mt-1">
              Defina e acompanhe os seus objetivos financeiros
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {/* Estatísticas */}
        {totalGoals > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGoals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                <CheckCircle className="h-4 w-4 text-income" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-income">
                  {completedGoals}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(0) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Poupado</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalCurrentAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {formatCurrency(totalTargetAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
                <Clock className="h-4 w-4 text-savings" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-savings">
                  {overallProgress.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  faltam {formatCurrency(totalTargetAmount - totalCurrentAmount)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Metas */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdateAmount={handleUpdateAmount}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma Meta Definida</CardTitle>
              <CardDescription>
                Comece a definir as suas metas de poupança para atingir os seus objetivos financeiros.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                Defina metas como "Fundo de Emergência", "Férias de Verão" ou "Casa Nova" 
                e acompanhe o seu progresso de forma visual.
              </p>
              <Button onClick={() => setFormOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeira Meta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dicas */}
        {goals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Dicas para Atingir as Suas Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">🎯 Seja Específico</h4>
                  <p>Defina metas claras com valores e prazos específicos. "€5000 para férias até Julho" é melhor que "poupar para férias".</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">📊 Acompanhe Regularmente</h4>
                  <p>Use os botões de adição rápida (+50€, +100€, +200€) para atualizar o progresso sempre que poupar.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">🏆 Comemore Conquistas</h4>
                  <p>Reconheça quando atingir as suas metas! O sucesso motiva para definir novos objetivos.</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">⚡ Automatize</h4>
                  <p>Configure transferências automáticas para as suas metas de poupança. A consistência é fundamental.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulário de Meta */}
      <GoalForm
        open={formOpen}
        onOpenChange={handleFormClose}
        goal={editingGoal}
        onSuccess={loadGoals}
      />
    </div>
  );
}; 