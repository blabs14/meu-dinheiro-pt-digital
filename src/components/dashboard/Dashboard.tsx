import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  Plus, 
  Calendar,
  CreditCard,
  Filter
} from 'lucide-react';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { RecentTransactions } from '@/features/transactions/components/RecentTransactions';
import { ExpensesPieChart } from '@/components/charts/ExpensesPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { SavingsProgressChart } from '@/components/charts/SavingsProgressChart';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { TransactionDebug } from '@/components/debug/TransactionDebug';

interface DashboardStats {
  receitas: number;
  despesas: number;
  saldo: number;
  metasAtivas: number;
  poupancaMensal: number;
  taxaPoupanca: number;
  upcomingBills: any[];
}

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { needsOnboarding, completeOnboarding } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'receita' | 'despesa'>('despesa');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [stats, setStats] = useState<DashboardStats>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    metasAtivas: 0,
    poupancaMensal: 0,
    taxaPoupanca: 0,
    upcomingBills: []
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  // Adicionar estado para stats da conta selecionada
  const [accountStats, setAccountStats] = useState<DashboardStats | null>(null);

  // Gerar opções de meses
  const getMonthOptions = () => {
    const options = [
      { value: 'current', label: 'Mês Atual' },
      { value: 'all', label: 'Todos os Meses' }
    ];
    
    // Adicionar últimos 12 meses
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      console.log('⚠️ [Dashboard] Sem utilizador autenticado');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [Dashboard] Iniciando carregamento de dados');
      console.log('🔍 [Dashboard] User ID:', user.id);
      console.log('🔍 [Dashboard] Filtro de mês:', selectedMonth);

      // Verificar sessão
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 [Dashboard] Sessão ativa:', !!session);
      
      if (!session) {
        console.error('❌ [Dashboard] Sem sessão ativa');
        throw new Error('Sem sessão ativa');
      }

      // Carregar transações pessoais (family_id IS NULL)
      console.log('🔍 [Dashboard] Carregando transações pessoais...');
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, account_id')
        .eq('user_id', user.id)
        .is('family_id', null);

      console.log('🔍 [Dashboard] Transações pessoais:', transactions);
      console.log('🔍 [Dashboard] Erro transações:', transactionsError);

      if (transactionsError) {
        console.error('❌ [Dashboard] Erro ao carregar transações:', transactionsError);
        throw transactionsError;
      }

      // Carregar metas pessoais (family_id IS NULL)
      console.log('🔍 [Dashboard] Carregando metas pessoais...');
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .is('family_id', null)
        .eq('status', 'active');

      console.log('🔍 [Dashboard] Metas pessoais:', goals);
      console.log('🔍 [Dashboard] Erro metas:', goalsError);

      if (goalsError) throw goalsError;

      // Filtrar transações baseado na seleção
      let filteredTransactions = transactions || [];
      
      if (selectedMonth === 'current') {
        // Mês atual
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        filteredTransactions = transactions?.filter(t => {
          const transactionDate = new Date(t.data);
          return transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        }) || [];
      } else if (selectedMonth !== 'all') {
        // Mês específico selecionado
        const [year, month] = selectedMonth.split('-').map(Number);
        
        filteredTransactions = transactions?.filter(t => {
          const transactionDate = new Date(t.data);
          return transactionDate.getMonth() === (month - 1) &&
                 transactionDate.getFullYear() === year;
        }) || [];
      }
      // Se selectedMonth === 'all', usar todas as transações

      // Calcular estatísticas
      const receitas = filteredTransactions
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);

      const despesas = filteredTransactions
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);

      const saldo = receitas - despesas;
      const taxaPoupanca = receitas > 0 ? (saldo / receitas) * 100 : 0;

      console.log('🔍 [Dashboard] Estatísticas calculadas:', {
        receitas,
        despesas,
        saldo,
        taxaPoupanca: taxaPoupanca.toFixed(2),
        metasAtivas: goals?.length || 0,
        totalTransacoes: filteredTransactions.length,
        filtro: selectedMonth
      });

      setStats({
        receitas,
        despesas,
        saldo,
        metasAtivas: goals?.length || 0,
        poupancaMensal: saldo,
        taxaPoupanca,
        upcomingBills: []
      });

      // Calcular stats da conta selecionada (se não for 'all')
      if (selectedAccountId && selectedAccountId !== 'all') {
        const filteredByAccount = filteredTransactions.filter(t => t.account_id === selectedAccountId);
        const receitasAcc = filteredByAccount.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
        const despesasAcc = filteredByAccount.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
        const saldoAcc = receitasAcc - despesasAcc;
        const taxaPoupancaAcc = receitasAcc > 0 ? (saldoAcc / receitasAcc) * 100 : 0;
        setAccountStats({
          receitas: receitasAcc,
          despesas: despesasAcc,
          saldo: saldoAcc,
          metasAtivas: 0,
          poupancaMensal: saldoAcc,
          taxaPoupanca: taxaPoupancaAcc,
          upcomingBills: []
        });
      } else {
        setAccountStats(null);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao carregar dados:', error);
      setStats({
        receitas: 0,
        despesas: 0,
        saldo: 0,
        metasAtivas: 0,
        poupancaMensal: 0,
        taxaPoupanca: 0,
        upcomingBills: []
      });
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth, selectedAccountId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (user) {
      loadUserAccounts();
    }
  }, [user]);

  const loadUserAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (!error) {
      setAccounts(data || []);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return;
    const { data, error } = await supabase
      .from('accounts')
      .insert({ user_id: user.id, nome: newAccountName.trim() })
      .select();
    if (!error && data && data[0]) {
      setAccounts(prev => [...prev, data[0]]);
      setSelectedAccountId(data[0].id);
      setShowAddAccount(false);
      setNewAccountName('');
    }
  };

  const handleAddTransaction = (type: 'receita' | 'despesa') => {
    setTransactionType(type);
    setShowTransactionForm(true);
  };

  const handleTransactionSuccess = () => {
    setShowTransactionForm(false);
    loadDashboardData();
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

  const getMonthLabel = () => {
    if (selectedMonth === 'current') return 'Este mês';
    if (selectedMonth === 'all') return 'Todos os meses';
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  };

  if (needsOnboarding) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Filtro de Mês */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">Dashboard Pessoal</h1>
        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-2 lg:gap-4">
          <label className="text-sm font-medium text-muted-foreground">Conta:</label>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full lg:w-[200px] p-2 border rounded-md bg-background text-sm"
          >
            <option value="all">Todas as Contas</option>
            {accounts && accounts.length > 0 && accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.nome}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowAddAccount(true)} className="w-full lg:w-auto">
            <Plus className="h-4 w-4 mr-1" /> Adicionar Conta
          </Button>
        </div>
        {showAddAccount && (
          <div className="mb-4 flex gap-2 items-center">
            <input
              type="text"
              value={newAccountName}
              onChange={e => setNewAccountName(e.target.value)}
              placeholder="Nome da nova conta"
              className="p-2 border rounded-md"
            />
            <Button size="sm" onClick={handleAddAccount}>Criar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddAccount(false)}>Cancelar</Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">
              {formatCurrency(stats.receitas)}
            </div>
            <p className="text-xs text-muted-foreground">{getMonthLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              {formatCurrency(stats.despesas)}
            </div>
            <p className="text-xs text-muted-foreground">{getMonthLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <PiggyBank className="h-4 w-4 text-savings" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSavingsColor(stats.taxaPoupanca)}`}>
              {stats.taxaPoupanca.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {accountStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
          <Card className="py-2 h-24">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Rendimento da Conta</CardTitle>
              <TrendingUp className="h-4 w-4 text-income" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-income">
                {formatCurrency(accountStats.receitas)}
              </div>
              <p className="text-xs text-muted-foreground">{getMonthLabel()}</p>
            </CardContent>
          </Card>
          <Card className="py-2 h-24">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Despesas da Conta</CardTitle>
              <TrendingDown className="h-4 w-4 text-expense" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-expense">
                {formatCurrency(accountStats.despesas)}
              </div>
              <p className="text-xs text-muted-foreground">{getMonthLabel()}</p>
            </CardContent>
          </Card>
          <Card className="py-2 h-24">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Taxa de Poupança</CardTitle>
              <PiggyBank className="h-4 w-4 text-savings" />
            </CardHeader>
            <CardContent>
              <div className={`text-base font-bold ${getSavingsColor(accountStats.taxaPoupanca)}`}>{accountStats.taxaPoupanca.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(accountStats.saldo)}</p>
            </CardContent>
          </Card>
        </div>
      )}

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <ExpensesPieChart familyId={null} accountId={selectedAccountId} />
        <SavingsProgressChart familyId={null} accountId={selectedAccountId} />
      </div>

      {/* Monthly Trend Chart */}
      <MonthlyTrendChart familyId={null} accountId={selectedAccountId} />

      {/* Recent Transactions */}
      <RecentTransactions familyId={null} accountId={selectedAccountId} selectedMonth={selectedMonth} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <Button 
          className="h-16 lg:h-24 flex flex-col gap-1 lg:gap-2" 
          variant="outline"
          onClick={() => {
            setTransactionType('despesa');
            setShowTransactionForm(true);
          }}
        >
          <Plus className="h-5 w-5 lg:h-6 lg:w-6" />
          <span className="text-sm lg:text-base">Nova Despesa</span>
        </Button>
        
        <Button 
          className="h-16 lg:h-24 flex flex-col gap-1 lg:gap-2" 
          variant="outline"
          onClick={() => {
            setTransactionType('receita');
            setShowTransactionForm(true);
          }}
        >
          <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" />
          <span className="text-sm lg:text-base">Nova Receita</span>
        </Button>
        
        <Button 
          className="h-16 lg:h-24 flex flex-col gap-1 lg:gap-2 sm:col-span-2 lg:col-span-1" 
          variant="outline"
          onClick={() => navigate('/goals')}
        >
          <Target className="h-5 w-5 lg:h-6 lg:w-6" />
          <span className="text-sm lg:text-base">Metas</span>
        </Button>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
        defaultType={transactionType}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};