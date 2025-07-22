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
  X
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

export const FamilyDashboardVisual = () => {
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
      loadFamilyData();
    } else if (!user && !authLoading) {
      console.log('🔍 [FamilyDashboard] Utilizador não autenticado, parando loading');
      setLoading(false);
    }
  }, [user, authLoading]);

  // Debug: Log stats changes
  useEffect(() => {
    console.log('🔍 [FamilyDashboardVisual] Estado atual das estatísticas:', stats);
  }, [stats]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadFamilyData(),
      loadUserPendingInvites()
    ]);
    setLoading(false);
  };

  const loadFamilyStats = async (familyId: string) => {
    try {
      console.log('🔍 [FamilyDashboard] Carregando estatísticas da família:', familyId);
      
      // Carregar transações da família
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('family_id', familyId);

      console.log('🔍 [FamilyDashboard] Transações da família:', transactions);
      console.log('🔍 [FamilyDashboard] Erro transações:', transactionsError);

      if (transactionsError) throw transactionsError;

      // Carregar metas da família
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('family_id', familyId);
        // .eq('status', 'active'); // Temporariamente comentado até adicionar a coluna

      console.log('🔍 [FamilyDashboard] Metas da família:', goals);
      console.log('🔍 [FamilyDashboard] Erro metas:', goalsError);

      if (goalsError) throw goalsError;

      // Calcular estatísticas para o mês atual
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

      console.log('🔍 [FamilyDashboard] Estatísticas calculadas:', {
        totalIncome,
        totalExpenses,
        savingsRate,
        activeGoals: goals?.length || 0,
        totalTransactions: transactions?.length || 0
      });

      setStats({
        totalIncome,
        totalExpenses,
        savingsRate,
        activeGoals: goals?.length || 0,
        memberCount: familyMembers.length
      });
    } catch (error) {
      console.error('❌ [FamilyDashboard] Erro ao carregar estatísticas:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast({
      title: 'Dados Atualizados',
      description: 'As informações da família foram recarregadas.'
    });
  };

  const handleRefreshStats = async () => {
    if (!currentFamily) return;
    
    console.log('🔍 [FamilyDashboardVisual] Refresh manual das estatísticas');
    setRefreshing(true);
    
    try {
      await loadFamilyStats(currentFamily.id);
      toast({
        title: 'Estatísticas Atualizadas',
        description: 'As estatísticas da família foram recarregadas.'
      });
    } catch (error) {
      console.error('❌ [FamilyDashboardVisual] Erro no refresh manual:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar estatísticas',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const loadFamilyData = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 [FamilyDashboard] Carregando dados da família:', user.id);
      
      // Carregar dados da família
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', user.id) // Assuming user.id is the family ID for now
        .single();

      if (familyError) {
        console.error('Erro ao carregar família:', familyError);
        return;
      }

      setCurrentFamily(family);
      
      // Carregar membros da família
      await loadFamilyMembers(user.id);
      
      // Carregar estatísticas
      await loadFamilyStats(user.id);
      
      console.log('🔍 [FamilyDashboard] Família carregada:', family);
    } catch (error) {
      console.error('Erro ao carregar dados da família:', error);
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .rpc('get_family_members_with_profiles', { p_family_id: familyId });
      if (error) return;
      if (membersData && (membersData as any).success && (membersData as any).members) {
        setFamilyMembers((membersData as any).members);
        setStats((prev) => ({ ...prev, memberCount: (membersData as any).members.length }));
      } else {
        setFamilyMembers([]);
        setStats((prev) => ({ ...prev, memberCount: 0 }));
      }
    } catch (error) {
      setFamilyMembers([]);
    }
  };

  const loadUserPendingInvites = async () => {
    if (!user) return;
    setInvitesLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc('get_user_pending_family_invites');
      if (data && data.success && data.invites) {
        setPendingInvites(data.invites);
      } else {
        setPendingInvites([]);
      }
    } finally {
      setInvitesLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    try {
      const { data, error } = await (supabase as any).rpc('accept_family_invite_by_email', { p_invite_id: inviteId });
      if (data && data.success) {
        toast({ title: 'Convite aceite!', description: 'Agora faz parte da família.' });
        await loadAllData();
      } else {
        toast({ title: 'Erro ao aceitar convite', description: data?.message || error?.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro ao aceitar convite', description: error.message, variant: 'destructive' });
    }
  };

  const rejectInvite = async (inviteId: string) => {
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
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
    await loadFamilyData(); // Reload current family data
    
    // If no family left, redirect to settings
    if (!currentFamily) {
      navigate('/settings');
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
      {/* Seletor de Família */}
      <FamilySelector
        selectedFamilyId={user.id} // Assuming user.id is the family ID for now
        onFamilySelect={() => {}} // No family selection for now
        userFamilies={[]} // No multiple families for now
        onLeaveFamily={handleLeaveFamily}
      />

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
                <ExpensesPieChart familyId={user.id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Tendência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart familyId={user.id} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Últimas Transações da Família</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions familyId={user.id} />
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
          <GoalsManager familyId={user.id} />

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

          {/* Debug Section (temporário) */}
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
          <h2 className="text-2xl font-bold mb-2">Nenhuma Família Selecionada</h2>
          <p className="text-muted-foreground mb-6">
            Selecione uma família no seletor acima ou crie uma nova família.
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