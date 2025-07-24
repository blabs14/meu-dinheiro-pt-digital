import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  LogOut,
  Filter,
  Plus
} from 'lucide-react';
import { ExpensesPieChart } from '@/components/charts/ExpensesPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { RecentTransactions } from '@/features/transactions/components/RecentTransactions';
import { GoalsManager } from '@/features/goals/components/GoalsManager';
import { SavingsProgressChart } from '@/components/charts/SavingsProgressChart';
import { useFamilyStats } from '@/hooks/useFamilyStats';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { makeFamilyService } from '@/features/family/services/familyService';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

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
  settings: any; // Mudado para any para evitar problemas de tipo
  userRole?: string;
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

export const FamilyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  
  // Estados para contas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  // Usar apenas um hook para stats
  const { totalIncome, totalExpenses, savingsRate, activeGoals, loading: statsLoading, error: statsError, refresh: refreshStats } = useFamilyStats(currentFamily?.id ?? null);
  
  const familyService = makeFamilyService(supabase);
  const { familyMembers: members, loadingMembers, loadFamilyMembers, removeMember, updateMemberRole } = useFamilyMembers(currentFamily?.id ?? null, familyService);

  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  // Gerar opções de meses
  const getMonthOptions = () => {
    const options = [
      { value: 'current', label: 'Mês Atual' },
      { value: 'all', label: 'Todos os Meses' }
    ];
    
    // Adicionar últimos 6 meses
    const currentDate = new Date();
    for (let i = 1; i <= 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ value, label: monthName });
    }
    
    return options;
  };

  // Carregar dados da família apenas uma vez
  useEffect(() => {
    if (user) {
      console.log('🔍 FamilyDashboard - useEffect - User mudou, carregando dados para:', user.id);
      loadFamilyData();
    }
  }, [user]);

  const loadUserFamilies = async () => {
    if (!user) return;
    
    setFamiliesLoading(true);
    try {
      console.log('🔍 FamilyDashboard - Carregando famílias para user:', user.id);
      
      // Tentar primeiro com a função RPC
      const { data, error } = await supabase.rpc('get_user_families', { user_id: user.id });
      
      console.log('🔍 FamilyDashboard - Resposta get_user_families:', { data, error });
      
      if (error) {
        console.error('❌ FamilyDashboard - Erro na função RPC, tentando query direta:', error);
        
        // Fallback: query direta
        const { data: directData, error: directError } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', user.id);
          
        console.log('🔍 FamilyDashboard - Query direta resultado:', { directData, directError });
        
        if (directError) {
          console.error('❌ FamilyDashboard - Erro na query direta:', directError);
          return;
        }
        
        if (directData && directData.length > 0) {
          const familyIds = directData.map(member => member.family_id);
          console.log('🔍 FamilyDashboard - IDs de família encontrados:', familyIds);
          
          // Carregar detalhes das famílias
          const familiesData = await Promise.all(
            familyIds.map(async (familyId: string) => {
              console.log('🔍 FamilyDashboard - Carregando detalhes da família:', familyId);
              
              const { data: familyData, error: familyError } = await supabase
                .from('families')
                .select('*')
                .eq('id', familyId)
                .single();

              if (familyError) {
                console.error('❌ FamilyDashboard - Erro ao carregar família:', familyError);
                return null;
              }

              console.log('🔍 FamilyDashboard - Dados da família:', familyData);

              // Obter role do utilizador nesta família
              const { data: memberData, error: memberError } = await supabase
                .from('family_members')
                .select('role')
                .eq('family_id', familyId)
                .eq('user_id', user.id)
                .single();

              console.log('🔍 FamilyDashboard - Role do utilizador:', memberData);

              return {
                ...familyData,
                userRole: memberData?.role || 'member'
              };
            })
          );

          const validFamilies = familiesData.filter(f => f !== null) as FamilyData[];
          console.log('🔍 FamilyDashboard - Famílias válidas (fallback):', validFamilies);
          
          setUserFamilies(validFamilies);
          
          if (validFamilies.length > 0 && !selectedFamilyId) {
            console.log('🔍 FamilyDashboard - Definindo primeira família como atual (fallback):', validFamilies[0]);
            setSelectedFamilyId(validFamilies[0].id);
            setCurrentFamily(validFamilies[0]);
          }
        }
        return;
      }

      if (data && data.length > 0) {
        console.log('🔍 FamilyDashboard - Famílias encontradas:', data);
        
        const familiesData = await Promise.all(
          data.map(async (familyId: string) => {
            console.log('🔍 FamilyDashboard - Carregando detalhes da família:', familyId);
            
            const { data: familyData, error: familyError } = await supabase
              .from('families')
              .select('*')
              .eq('id', familyId)
              .single();

            if (familyError) {
              console.error('❌ FamilyDashboard - Erro ao carregar família:', familyError);
              return null;
            }

            console.log('🔍 FamilyDashboard - Dados da família:', familyData);

            // Obter role do utilizador nesta família
            const { data: memberData, error: memberError } = await supabase
              .from('family_members')
              .select('role')
              .eq('family_id', familyId)
              .eq('user_id', user.id)
              .single();

            console.log('🔍 FamilyDashboard - Role do utilizador:', memberData);

            return {
              ...familyData,
              userRole: memberData?.role || 'member'
            };
          })
        );

        const validFamilies = familiesData.filter(f => f !== null) as FamilyData[];
        console.log('🔍 FamilyDashboard - Famílias válidas:', validFamilies);
        
        setUserFamilies(validFamilies);
        
        if (validFamilies.length > 0 && !selectedFamilyId) {
          console.log('🔍 FamilyDashboard - Definindo primeira família como atual:', validFamilies[0]);
          setSelectedFamilyId(validFamilies[0].id);
          setCurrentFamily(validFamilies[0]);
        }
      } else {
        console.log('🔍 FamilyDashboard - Nenhuma família encontrada para o utilizador');
      }
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao carregar famílias:', error);
    } finally {
      setFamiliesLoading(false);
    }
  };

  const loadFamilyData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔍 FamilyDashboard - Iniciando carregamento para user:', user.id);
      
      // Carregar famílias primeiro
      await loadUserFamilies();
      
      // Carregar contas e convites
      await loadUserAccounts();
      await loadUserPendingInvites();
      
      // Se temos uma família selecionada, carregar membros
      if (currentFamily?.id) {
        console.log('🔍 FamilyDashboard - Carregando membros para família:', currentFamily.id);
        await loadFamilyMembersDirect(currentFamily.id);
      } else {
        console.log('🔍 FamilyDashboard - Nenhuma família selecionada ainda');
      }
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao carregar dados da família:', error);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar membros quando currentFamily mudar
  useEffect(() => {
    if (currentFamily?.id) {
      console.log('🔍 FamilyDashboard - useEffect - CurrentFamily mudou, carregando membros para:', currentFamily.id);
      loadFamilyMembersDirect(currentFamily.id);
    }
  }, [currentFamily?.id]);

  const loadFamilyMembersDirect = async (familyId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_family_members_with_profiles', { p_family_id: familyId });
      
      if (error) {
        console.error('❌ FamilyDashboard - Erro ao carregar membros:', error);
        return;
      }

      if (data && typeof data === 'object' && 'success' in data && 'members' in data) {
        const response = data as any;
        if (response.success && response.members) {
          setFamilyMembers(response.members);
        }
      }
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao carregar membros:', error);
    }
  };

  const loadUserAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ FamilyDashboard - Erro ao carregar contas:', error);
        return;
      }

      setAccounts(data || []);
      if (data && data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao carregar contas:', error);
    }
  };

  const loadUserPendingInvites = async () => {
    if (!user) return;
    
    setInvitesLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ FamilyDashboard - Erro ao carregar convites:', error);
        return;
      }

      // Converter para o tipo correto
      const typedInvites = (data || []).map(invite => ({
        ...invite,
        status: invite.status as 'pending' | 'accepted' | 'declined'
      }));
      setPendingInvites(typedInvites);
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao carregar convites:', error);
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

      if (error) {
        console.error('❌ FamilyDashboard - Erro ao aceitar convite:', error);
        return;
      }

      toast({
        title: "Convite Aceite",
        description: "Juntou-se à família com sucesso.",
      });

      await loadUserPendingInvites();
      await loadUserFamilies();
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao aceitar convite:', error);
    }
  };

  const rejectInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      if (error) {
        console.error('❌ FamilyDashboard - Erro ao rejeitar convite:', error);
        return;
      }

      toast({
        title: "Convite Rejeitado",
        description: "Convite rejeitado com sucesso.",
      });

      await loadUserPendingInvites();
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao rejeitar convite:', error);
    }
  };

  const handleRefresh = async () => {
    console.log('🔍 FamilyDashboard - Refresh manual solicitado');
    setRefreshing(true);
    try {
      await loadFamilyData();
      await refreshStats();
      toast({
        title: "Dados Atualizados",
        description: "As informações da família foram recarregadas.",
      });
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro no refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLeaveFamily = async (familyId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ FamilyDashboard - Erro ao sair da família:', error);
        return;
      }

      toast({
        title: "Saiu da Família",
        description: "Saiu da família com sucesso.",
      });

      await loadUserFamilies();
    } catch (error) {
      console.error('❌ FamilyDashboard - Erro ao sair da família:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'owner': 'Dono',
      'admin': 'Administrador',
      'member': 'Membro',
      'viewer': 'Visualizador'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      'owner': 'default',
      'admin': 'secondary',
      'member': 'outline',
      'viewer': 'destructive'
    };
    return variants[role as keyof typeof variants] || 'outline';
  };

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
    <div className="space-y-4 lg:space-y-6">
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
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <select
                      value={selectedFamilyId}
                      onChange={(e) => {
                        const familyId = e.target.value;
                        setSelectedFamilyId(familyId);
                        const selectedFamily = userFamilies.find(f => f.id === familyId);
                        if (selectedFamily) {
                          setCurrentFamily(selectedFamily);
                        }
                      }}
                      className="w-full sm:flex-1 sm:max-w-xs p-2 border rounded-md bg-background text-sm"
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
                      className="text-red-600 hover:text-red-700 w-full sm:w-auto"
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
              
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                  {currentFamily.nome}
                </h1>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full sm:w-[200px] p-2 border rounded-md bg-background text-sm"
                  >
                    {getMonthOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Dashboard da família • {familyMembers.length} membros • Você é {getRoleLabel(userRole)}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendimento Familiar</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
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
                  {formatCurrency(totalExpenses)}
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
                  {savingsRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totalIncome - totalExpenses)}
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
                  {activeGoals}
                </div>
                <p className="text-xs text-muted-foreground">
                  {familyMembers.length} membros
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos e Transações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Gráfico de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpensesPieChart familyId={currentFamily.id} accountId={selectedAccountId} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Tendência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart familyId={currentFamily.id} accountId={selectedAccountId} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Últimas Transações da Família</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions familyId={currentFamily.id} accountId={selectedAccountId} selectedMonth={selectedMonth} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
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

          {/* Taxa de Poupança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Taxa de Poupança
              </CardTitle>
              <CardDescription>
                Acompanhe sua taxa de poupança ao longo do tempo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SavingsProgressChart familyId={currentFamily.id} accountId={selectedAccountId} />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl lg:text-2xl font-bold mb-2">Nenhuma Família Encontrada</h2>
          <p className="text-muted-foreground mb-6">
            Precisa de criar ou juntar-se a uma família para ver o dashboard.
          </p>
          <Button onClick={() => navigate('/settings')} className="w-full sm:w-auto">
            <Settings className="h-4 w-4 mr-2" />
            Ir para Configurações
          </Button>
        </div>
      )}
    </div>
  );
}; 