import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Calendar,
  Plus,
  Target,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { RecentTransactions } from '@/components/transactions/RecentTransactions';
import { ExpensesPieChart, MonthlyTrendChart, SavingsProgressChart } from '@/components/charts';
import { WelcomeTutorial } from '@/components/onboarding';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  upcomingBills: any[];
}

export const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    savingsRate: 0,
    upcomingBills: []
  });
  const [loading, setLoading] = useState(true);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receita' | 'despesa'>('despesa');
  const [refreshTransactions, setRefreshTransactions] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Verificar se é a primeira vez no dashboard
      const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${user.id}`);
      if (!hasSeenTutorial) {
        // Mostrar tutorial após um pequeno delay
        setTimeout(() => {
          setShowTutorial(true);
        }, 1000);
      }
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Get current month transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('valor, tipo')
        .eq('user_id', user!.id)
        .gte('data', `${currentMonth}-01`)
        .lt('data', `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10)}`);

      if (transactionsError) throw transactionsError;

      // Calculate totals
      const income = transactions
        ?.filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + Number(t.valor), 0) || 0;
        
      const expenses = transactions
        ?.filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + Number(t.valor), 0) || 0;

      // Get upcoming fixed expenses
      const { data: fixedExpenses, error: fixedError } = await supabase
        .from('fixed_expenses')
        .select('nome, valor, dia_vencimento')
        .eq('user_id', user!.id)
        .eq('ativa', true);

      if (fixedError) throw fixedError;

      // Calculate savings rate
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        savingsRate,
        upcomingBills: fixedExpenses || []
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSuccess = () => {
    loadDashboardData();
    setRefreshTransactions(prev => prev + 1);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    if (user) {
      localStorage.setItem(`tutorial_seen_${user.id}`, 'true');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const getSavingsColor = (rate: number) => {
    if (rate >= 20) return 'text-success';
    if (rate >= 10) return 'text-warning';
    return 'text-expense';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <PiggyBank className="h-4 w-4 text-savings" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSavingsColor(stats.savingsRate)}`}>
              {stats.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalIncome - stats.totalExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bills */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Faturas
              </CardTitle>
              <CardDescription>Despesas fixas a vencer</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats.upcomingBills.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingBills.map((bill, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{bill.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Dia {bill.dia_vencimento}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-expense border-expense">
                    {formatCurrency(Number(bill.valor))}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma despesa fixa configurada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensesPieChart refreshTrigger={refreshTransactions} />
        <SavingsProgressChart refreshTrigger={refreshTransactions} />
      </div>

      {/* Monthly Trend Chart */}
      <MonthlyTrendChart refreshTrigger={refreshTransactions} />

      {/* Recent Transactions */}
      <RecentTransactions refreshTrigger={refreshTransactions} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          className="h-24 flex flex-col gap-2" 
          variant="outline"
          onClick={() => {
            setTransactionType('despesa');
            setTransactionFormOpen(true);
          }}
        >
          <Plus className="h-6 w-6" />
          <span>Nova Despesa</span>
        </Button>
        
        <Button 
          className="h-24 flex flex-col gap-2" 
          variant="outline"
          onClick={() => {
            setTransactionType('receita');
            setTransactionFormOpen(true);
          }}
        >
          <TrendingUp className="h-6 w-6" />
          <span>Nova Receita</span>
        </Button>
        
        <Button 
          className="h-24 flex flex-col gap-2" 
          variant="outline"
          onClick={() => navigate('/goals')}
        >
          <Target className="h-6 w-6" />
          <span>Metas</span>
        </Button>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        defaultType={transactionType}
        onSuccess={handleTransactionSuccess}
      />

      {/* Tutorial de Boas-vindas */}
      <WelcomeTutorial
        open={showTutorial}
        onOpenChange={handleTutorialClose}
      />
    </div>
  );
};