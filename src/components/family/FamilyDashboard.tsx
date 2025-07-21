import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Target,
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FamilyDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('member');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    savingsRate: 0,
    memberCount: 0,
    activeGoals: 0
  });

  useEffect(() => {
    if (user) {
      loadFamilyData();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFamilyData();
      toast({
        title: "Dados Atualizados",
        description: "As informações da família foram recarregadas.",
      });
    } catch (error) {
      console.error('Erro no refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadFamilyData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 FamilyDashboard - Iniciando carregamento para user:', user.id);

      // Carregar dados da família
      const { data: familyData, error: familyError } = await supabase
        .rpc('get_user_family_data', { p_user_id: user.id });

      console.log('🔍 FamilyDashboard - Resposta da função:', { familyData, familyError });

      if (familyError) {
        console.warn('⚠️ Função SQL falhou:', familyError);
        setCurrentFamily(null);
        return;
      }

      if (familyData && Array.isArray(familyData) && familyData.length > 0) {
        const familyResponse = familyData[0] as any;
        console.log('🔍 FamilyDashboard - Processando resposta:', familyResponse);
        
        if (familyResponse.family && familyResponse.family_member) {
          const family = familyResponse.family;
          const member = familyResponse.family_member;
          
          console.log('🔍 FamilyDashboard - Dados da família:', family);
          console.log('🔍 FamilyDashboard - Dados do membro:', member);
          
          setCurrentFamily(family);
          setUserRole(member.role);
          
          console.log('✅ FamilyDashboard - Família definida:', family.nome);
          
          // Carregar dados adicionais
          await loadFamilyMembers(family.id);
          await loadFamilyStats(family.id); // Carregar estatísticas
        } else {
          console.warn('⚠️ FamilyDashboard - Estrutura de dados inválida:', familyResponse);
          setCurrentFamily(null);
        }
      } else {
        console.warn('⚠️ FamilyDashboard - Nenhum dado retornado:', familyData);
        setCurrentFamily(null);
      }

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados da família:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da família: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('🔍 FamilyDashboard - Carregamento finalizado. Família atual:', currentFamily?.nome || 'Nenhuma');
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .rpc('get_family_members_with_profiles', { p_family_id: familyId });

      if (error) {
        console.warn('⚠️ Erro ao carregar membros:', error);
        return;
      }

      if (Array.isArray(membersData)) {
        setFamilyMembers(membersData);
        setStats(prev => ({ ...prev, memberCount: membersData.length }));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar membros:', error);
    }
  };

  const loadFamilyStats = async (familyId: string) => {
    try {
      console.log('🔍 [FamilyDashboard] Carregando estatísticas para família:', familyId);
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Carregar transações da família do mês atual
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('valor, tipo')
        .eq('family_id', familyId)
        .gte('data', `${currentMonth}-01`)
        .lt('data', `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10)}`);

      if (transactionsError) {
        console.error('❌ [FamilyDashboard] Erro ao carregar transações:', transactionsError);
        throw transactionsError;
      }

      // Calcular totais
      const income = transactions
        ?.filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + Number(t.valor), 0) || 0;
        
      const expenses = transactions
        ?.filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + Number(t.valor), 0) || 0;

      // Calcular taxa de poupança
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

      // Carregar número de metas da família
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('id')
        .eq('family_id', familyId);

      if (goalsError) {
        console.error('❌ [FamilyDashboard] Erro ao carregar metas:', goalsError);
      }

      const newStats = {
        totalIncome: income,
        totalExpenses: expenses,
        savingsRate,
        activeGoals: goals?.length || 0
      };

      setStats(prev => ({
        ...prev,
        ...newStats
      }));

      console.log('🔍 [FamilyDashboard] Estatísticas atualizadas:', newStats);

    } catch (error) {
      console.error('❌ [FamilyDashboard] Erro ao carregar estatísticas da família:', error);
      // Definir valores padrão em caso de erro
      setStats(prev => ({
        ...prev,
        totalIncome: 0,
        totalExpenses: 0,
        savingsRate: 0,
        activeGoals: 0
      }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      owner: 'Dono',
      admin: 'Administrador',
      member: 'Membro',
      viewer: 'Visualizador'
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
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

  if (!currentFamily) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhuma Família Encontrada</h2>
          <p className="text-muted-foreground mb-6">
            Precisa de criar ou juntar-se a uma família para ver o dashboard familiar.
          </p>
          <Button onClick={() => navigate('/settings')} className="mr-4">
            <Settings className="h-4 w-4 mr-2" />
            Ir para Configurações
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            {currentFamily.nome}
          </h1>
          <p className="text-muted-foreground mt-1">
            Dashboard da família • {stats.memberCount} membros • Você é {getRoleLabel(userRole)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Gerir Família
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimento Familiar</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Familiares</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalIncome - stats.totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.activeGoals}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.memberCount} membros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Membros da Família */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Família
          </CardTitle>
          <CardDescription>
            {familyMembers.length} membros ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {familyMembers.map((member: any) => (
              <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {member.profiles?.nome?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.profiles?.nome || 'Utilizador'}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.profiles?.email}
                  </p>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role) as any}>
                  {getRoleLabel(member.role)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder para Metas da Família */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas da Família
          </CardTitle>
          <CardDescription>
            Metas ativas de todos os membros (em desenvolvimento)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Funcionalidade de metas familiares em desenvolvimento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 