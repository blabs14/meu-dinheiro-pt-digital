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
  RefreshCw,
  Check,
  X,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExpensesPieChart } from '@/components/charts/ExpensesPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { RecentTransactions } from '@/components/transactions/RecentTransactions';
import { GoalsManager } from '@/components/goals/GoalsManager';
import { FamilySelector } from './FamilySelector';

interface FamilyMember {
  id: string;
  user_id: string;
  family_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joined_at: string;
  profiles?: {
    nome: string;
    email?: string;
  };
}

interface FamilyData {
  id: string;
  nome: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  settings: {
    allow_view_all: boolean;
    allow_add_transactions: boolean;
    require_approval: boolean;
  };
  userRole?: string; // Adicionar campo opcional para o role do utilizador
}

interface FamilyInvite {
  id: string;
  family_id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string;
  created_at: string;
  expires_at: string;
}

export const FamilyDashboardVisualFixed = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFamily, setCurrentFamily] = useState<FamilyData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [userRole, setUserRole] = useState<string>('member');
  const [pendingInvites, setPendingInvites] = useState<FamilyInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  
  // Novos estados para múltiplas famílias
  const [userFamilies, setUserFamilies] = useState<FamilyData[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [familiesLoading, setFamiliesLoading] = useState(false);
  
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    savingsRate: 0,
    memberCount: 0,
    activeGoals: 0
  });

  useEffect(() => {
    console.log('🔍 [FamilyDashboard] useEffect triggered:', { user: !!user, authLoading, loading });
    if (user && !authLoading) {
      console.log('🔍 [FamilyDashboard] Carregando dados da família');
      loadUserFamilies();
    } else if (!user && !authLoading) {
      console.log('🔍 [FamilyDashboard] Utilizador não autenticado, parando loading');
      setLoading(false);
    }
  }, [user, authLoading]);

  // Carregar todas as famílias do utilizador
  const loadUserFamilies = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setFamiliesLoading(true);
    setLoading(true);
    console.log('🔍 [FamilyDashboard] Carregando todas as famílias do utilizador:', user.id);
    
    try {
      const { data: familyMembers, error: memberError } = await supabase
        .from('family_members')
        .select(`
          family_id,
          role,
          families (*)
        `)
        .eq('user_id', user.id);

      console.log('🔍 [FamilyDashboard] Resultado da query:', { familyMembers, memberError });

      if (memberError) {
        console.error('Erro ao carregar famílias:', memberError);
        setLoading(false);
        return;
      }

      if (familyMembers && familyMembers.length > 0) {
        const familiesData = familyMembers.map(fm => ({
          ...fm.families,
          userRole: fm.role,
          settings: fm.families.settings as {
            allow_view_all: boolean;
            allow_add_transactions: boolean;
            require_approval: boolean;
          }
        })) as FamilyData[];
        
        setUserFamilies(familiesData);
        
        // Selecionar a primeira família por padrão
        if (!selectedFamilyId && familiesData.length > 0) {
          setSelectedFamilyId(familiesData[0].id);
          setCurrentFamily(familiesData[0]);
          setUserRole(familiesData[0].userRole || 'member');
        }
        
        console.log('🔍 [FamilyDashboard] Famílias carregadas:', familiesData);
      } else {
        console.log('🔍 [FamilyDashboard] Utilizador não pertence a nenhuma família');
        setUserFamilies([]);
        setCurrentFamily(null);
        setUserRole('member');
        setFamilyMembers([]);
        setStats({
          totalIncome: 0,
          totalExpenses: 0,
          savingsRate: 0,
          memberCount: 0,
          activeGoals: 0
        });
      }
      
      console.log('🔍 [FamilyDashboard] Processamento concluído');
    } catch (error) {
      console.error('Erro ao carregar famílias:', error);
    } finally {
      setFamiliesLoading(false);
      setLoading(false);
    }
  };

  // Carregar dados da família selecionada
  useEffect(() => {
    if (selectedFamilyId && user) {
      loadFamilyData();
    }
  }, [selectedFamilyId, user]);

  const loadFamilyData = async () => {
    if (!user || !selectedFamilyId) return;
    
    console.log('🔍 [FamilyDashboard] Carregando dados da família selecionada:', selectedFamilyId);
    
    try {
      // Encontrar a família selecionada
      const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
      if (!selectedFamily) {
        console.error('Família selecionada não encontrada');
        return;
      }

      setCurrentFamily(selectedFamily);
      setUserRole(selectedFamily.userRole || 'member');
      
      // Carregar membros da família
      await loadFamilyMembers(selectedFamilyId);
      
      // Carregar estatísticas
      await loadFamilyStats(selectedFamilyId);
      
      // Carregar convites pendentes
      await loadUserPendingInvites();
      
      console.log('🔍 [FamilyDashboard] Dados da família carregados:', selectedFamily);
    } catch (error) {
      console.error('Erro ao carregar dados da família:', error);
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    try {
      const { data: members, error } = await supabase
        .from('family_members')
        .select(`
          *,
          profiles (nome, email)
        `)
        .eq('family_id', familyId);

      if (error) {
        console.error('Erro ao carregar membros:', error);
        return;
      }

      setFamilyMembers(members as FamilyMember[] || []);
      setStats(prev => ({ ...prev, memberCount: members?.length || 0 }));
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const loadFamilyStats = async (familyId: string) => {
    try {
      console.log('🔍 [FamilyDashboard] Carregando estatísticas da família:', familyId);
      
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('family_id', familyId);

      if (transactionsError) throw transactionsError;

      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('family_id', familyId);

      if (goalsError) throw goalsError;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalIncome = transactions
        ?.filter(t => {
          const transactionDate = new Date(t.data);
          return t.tipo === 'receita' && 
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        ?.reduce((sum, t) => sum + Number(t.valor), 0) || 0;

      const totalExpenses = transactions
        ?.filter(t => {
          const transactionDate = new Date(t.data);
          return t.tipo === 'despesa' && 
                 transactionDate.getMonth() === currentMonth &&
                 transactionDate.getFullYear() === currentYear;
        })
        ?.reduce((sum, t) => sum + Number(t.valor), 0) || 0;

      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      setStats({
        totalIncome,
        totalExpenses,
        savingsRate,
        memberCount: familyMembers.length,
        activeGoals: goals?.length || 0
      });

      console.log('🔍 [FamilyDashboard] Estatísticas calculadas:', {
        totalIncome,
        totalExpenses,
        savingsRate,
        activeGoals: goals?.length || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadUserPendingInvites = async () => {
    if (!user) return;
    
    setInvitesLoading(true);
    try {
      const { data: invites, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'pending');

      if (error) {
        console.error('Erro ao carregar convites:', error);
        return;
      }

      setPendingInvites(invites as FamilyInvite[] || []);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setInvitesLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (error) throw error;

      toast({ title: 'Convite Aceite', description: 'Juntou-se à família com sucesso!' });
      loadFamilyData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      toast({ title: 'Erro', description: 'Erro ao aceitar convite', variant: 'destructive' });
    }
  };

  const rejectInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      if (error) throw error;

      toast({ title: 'Convite Rejeitado', description: 'Convite rejeitado com sucesso.' });
      loadUserPendingInvites(); // Recarregar convites
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      toast({ title: 'Erro', description: 'Erro ao rejeitar convite', variant: 'destructive' });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFamilyData();
    setRefreshing(false);
  };

  const handleRefreshStats = async () => {
    if (currentFamily) {
      await loadFamilyStats(currentFamily.id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Dono';
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
      case 'viewer': return 'Visualizador';
      default: return 'Membro';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  // Função para sair de uma família específica
  const handleLeaveFamily = async (familyId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', user.id);
      
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Saiu da Família', description: 'Saiu da família com sucesso.' });
    
    // Recarregar famílias e selecionar a próxima disponível
    await loadUserFamilies();
    
    // Se não houver mais famílias, redirecionar
    if (userFamilies.length <= 1) {
      navigate('/');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Não Autenticado</h2>
          <p className="text-muted-foreground">Faça login para continuar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Convites Pendentes */}
      {pendingInvites.length > 0 && (
        <Card className="border-yellow-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">Convites Pendentes</CardTitle>
            <CardDescription>Tem convites para se juntar a uma família:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Família: {invite.family_id}</p>
                    <p className="text-xs text-muted-foreground">Papel: {invite.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => acceptInvite(invite.id)}>
                      <Check className="h-4 w-4" /> Aceitar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectInvite(invite.id)}>
                      <X className="h-4 w-4" /> Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard da Família */}
      {currentFamily ? (
        <>
          {/* Header e Estatísticas */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Seletor de Família - Dropdown */}
              {userFamilies.length > 1 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Selecionar Família:
                  </label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedFamilyId}
                      onChange={(e) => {
                        const familyId = e.target.value;
                        setSelectedFamilyId(familyId);
                      }}
                      className="flex-1 max-w-xs p-2 border rounded-md bg-background"
                    >
                      {userFamilies.map((family) => (
                        <option key={family.id} value={family.id}>
                          {family.nome} ({family.userRole})
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveFamily(selectedFamilyId)}
                      disabled={currentFamily?.userRole === 'owner'}
                      className="text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sair
                    </Button>
                  </div>
                  {currentFamily?.userRole === 'owner' && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Como owner, deve transferir o ownership antes de sair da família.
                    </p>
                  )}
                </div>
              )}
              
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
                onClick={handleRefreshStats}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Atualizando Estatísticas...' : 'Atualizar Estatísticas'}
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

          {/* Gráficos e Transações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Gráfico de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpensesPieChart familyId={currentFamily.id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Tendência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart familyId={currentFamily.id} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Últimas Transações da Família</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions familyId={currentFamily.id} />
            </CardContent>
          </Card>

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
                      {member.profile?.nome?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.profile?.nome || 'Utilizador'}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.profile?.email}
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

          {/* Metas da Família */}
          <GoalsManager familyId={currentFamily.id} />

          {/* Debug Section */}
          <Card className="border-orange-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">Debug - Estado Atual</CardTitle>
              <CardDescription>Informações de debug para diagnóstico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Família ID:</strong> {currentFamily?.id || 'N/A'}</div>
                <div><strong>Família Nome:</strong> {currentFamily?.nome || 'N/A'}</div>
                <div><strong>User ID:</strong> {user?.id || 'N/A'}</div>
                <div><strong>User Role:</strong> {userRole}</div>
                <div><strong>Stats:</strong> {JSON.stringify(stats, null, 2)}</div>
                <div><strong>Membros:</strong> {familyMembers.length}</div>
                <div><strong>Loading:</strong> {loading.toString()}</div>
                <div><strong>Refreshing:</strong> {refreshing.toString()}</div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhuma Família Encontrada</h2>
          <p className="text-muted-foreground mb-6">
            Precisa de criar ou juntar-se a uma família para ver o dashboard.
          </p>
          <Button onClick={() => navigate('/settings')} className="mr-4">
            <Settings className="h-4 w-4 mr-2" />
            Ir para Configurações
          </Button>
        </div>
      )}
    </div>
  );
}; 