import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PiggyBank, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface SavingsData {
  totalIncome: number;
  totalExpenses: number;
  savingsAmount: number;
  savingsRate: number;
  targetRate: number;
}

interface SavingsProgressChartProps {
  refreshTrigger?: number;
  familyId?: string;
}

export const SavingsProgressChart = ({ refreshTrigger, familyId }: SavingsProgressChartProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<SavingsData>({
    totalIncome: 0,
    totalExpenses: 0,
    savingsAmount: 0,
    savingsRate: 0,
    targetRate: 20 // Meta padrão de 20%
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSavingsData();
    }
  }, [user, refreshTrigger, familyId]);

  const loadSavingsData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Buscar transações do mês atual
      let query = supabase.from('transactions').select('valor, tipo');
      
      // Se familyId for fornecido, filtrar apenas transações dessa família
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else {
        // Se não for fornecido, mostrar apenas transações pessoais (family_id IS NULL)
        query = query.is('family_id', null);
      }
      
      const { data: transactions, error: transactionsError } = await query
        .gte('data', `${currentMonth}-01}`)
        .lt('data', `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10)}`);

      if (transactionsError) throw transactionsError;

      // Buscar meta de poupança do perfil do utilizador (apenas para dados pessoais)
      let targetRate = 20; // Meta padrão
      if (!familyId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('poupanca_mensal')
          .eq('user_id', user!.id)
          .single();

        if (!profileError && profile?.poupanca_mensal) {
          targetRate = profile.poupanca_mensal;
        }
      }

      // Calcular totais
      const income = transactions
        ?.filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + Number(t.valor), 0) || 0;
        
      const expenses = transactions
        ?.filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + Number(t.valor), 0) || 0;

      const savingsAmount = income - expenses;
      const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;

      setData({
        totalIncome: income,
        totalExpenses: expenses,
        savingsAmount,
        savingsRate: Math.max(0, savingsRate), // Não mostrar taxa negativa
        targetRate
      });

    } catch (error) {
      console.error('Erro ao carregar dados de poupança:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const getProgressColor = (rate: number, target: number) => {
    if (rate >= target) return 'rgb(34, 197, 94)'; // Verde
    if (rate >= target * 0.7) return 'rgb(234, 179, 8)'; // Amarelo
    return 'rgb(239, 68, 68)'; // Vermelho
  };

  const getProgressStatus = (rate: number, target: number) => {
    if (rate >= target) return { text: 'Meta Atingida!', variant: 'default' as const };
    if (rate >= target * 0.7) return { text: 'Quase lá!', variant: 'secondary' as const };
    return { text: 'Abaixo da Meta', variant: 'destructive' as const };
  };

  // Dados para o gráfico circular
  const progressData = [
    { name: 'Poupado', value: Math.min(data.savingsRate, data.targetRate), fill: getProgressColor(data.savingsRate, data.targetRate) },
    { name: 'Restante', value: Math.max(0, data.targetRate - data.savingsRate), fill: '#e5e7eb' }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Taxa de Poupança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getProgressStatus(data.savingsRate, data.targetRate);
  const progressPercentage = Math.min((data.savingsRate / data.targetRate) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          Taxa de Poupança
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.text}</Badge>
          <span className="text-sm text-muted-foreground">
            Meta: {data.targetRate.toFixed(0)}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico circular */}
          <div className="relative">
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {progressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Texto central */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold" style={{ color: getProgressColor(data.savingsRate, data.targetRate) }}>
                  {data.savingsRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(data.savingsAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Meta</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-income" />
                <span className="text-sm font-medium">Receitas</span>
              </div>
              <p className="text-lg font-bold text-income">
                {formatCurrency(data.totalIncome)}
              </p>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="h-4 w-4 text-expense" />
                <span className="text-sm font-medium">Despesas</span>
              </div>
              <p className="text-lg font-bold text-expense">
                {formatCurrency(data.totalExpenses)}
              </p>
            </div>
          </div>

          {/* Dicas */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Dica</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.savingsRate >= data.targetRate 
                ? "Parabéns! Está a conseguir poupar acima da sua meta mensal."
                : `Para atingir a meta de ${data.targetRate}%, precisa de poupar mais ${formatCurrency((data.totalIncome * (data.targetRate / 100)) - data.savingsAmount)}.`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 