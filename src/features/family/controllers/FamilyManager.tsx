import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Eye, 
  EyeOff, 
  Mail, 
  Shield, 
  Trash2,
  Settings,
  Share2,
  CheckCircle,
  Clock,
  X,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useFamilyData } from '@/hooks/useFamilyData';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useFamilyInvites } from '@/hooks/useFamilyInvites';

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
}

export const FamilyManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Substituir estados e funções de dados da família pelo hook
  const {
    loading,
    currentFamily,
    loadFamilyData,
    updateFamily,
    deleteFamily,
    handleRefresh,
    refreshing,
  } = useFamilyData();
  // Substituir estados e funções de membros pelo hook
  const {
    familyMembers,
    loadingMembers,
    loadFamilyMembers,
    removeMember,
    updateMemberRole,
  } = useFamilyMembers(currentFamily?.id ?? null);
  // Substituir estados e funções de convites pelo hook
  const {
    pendingInvites,
    loadingInvites,
    loadFamilyInvites,
    loadUserPendingInvites,
    inviteMember,
    acceptInvite,
    declineInvite,
    cancelInvite,
  } = useFamilyInvites(currentFamily?.id ?? null, user?.email ?? null);
  const [userRole, setUserRole] = useState<string>('member');

  // States para formulários
  const [familyName, setFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [createLoading, setCreateLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Adicionar ao início do componente, após os outros states
  const [pendingInvitesForUser, setPendingInvitesForUser] = useState<FamilyInvite[]>([]);
  const [showDeleteFamily, setShowDeleteFamily] = useState(false);
  // Remover duplicação de refreshing
  // const [refreshing, setRefreshing] = useState(false); // já vem do hook

  useEffect(() => {
    console.log('[FamilyManager] MONTADO');
    return () => {
      console.log('[FamilyManager] DESMONTADO');
    };
  }, []);
  console.log('[FamilyManager] user:', user);

  useEffect(() => {
    if (user) {
      loadFamilyData();
      loadUserPendingInvites();
    }
  }, [user]);

  // Função para refresh manual
  const handleRefreshManual = async () => {
    // setRefreshing(true); // já vem do hook
    try {
      await Promise.all([
        loadFamilyData(),
        loadUserPendingInvites()
      ]);
      toast({
        title: "Dados Atualizados",
        description: "As informações foram recarregadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro no refresh:', error);
    } finally {
      // setRefreshing(false); // já vem do hook
    }
  };

  // Remover duplicação de loadFamilyMembers
  // const loadFamilyMembers = async (familyId: string) => { ... } // já vem do hook

  // Remover funções e estados duplicados relacionados com convites

  const createFamily = async () => {
    if (!user || !familyName.trim()) return;

    setCreateLoading(true);
    try {
      // Usar função SQL mais simples e robusta
      const { data: familyId, error } = await supabase
        .rpc('create_family_direct', {
          p_family_name: familyName.trim(),
          p_user_id: user.id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Família Criada! 🏡",
        description: `A família "${familyName}" foi criada com sucesso`,
      });

      // Recarregar dados
      await loadFamilyData();
      setFamilyName('');

    } catch (error: any) {
      console.error('Erro na criação da família:', error);
      
      toast({
        title: "Erro na Criação",
        description: "Não foi possível criar a família. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const leaveFamily = async () => {
    if (!currentFamily || !user) return;

    try {
      // Verificar se é o owner e se há outros membros
      if (userRole === 'owner') {
        const otherMembers = familyMembers.filter(m => m.user_id !== user.id);
        
        if (otherMembers.length === 0) {
          // Se é o único membro, eliminar a família
          await deleteFamily();
          return;
        } else {
          // Se há outros membros, mostrar aviso
          toast({
            title: "Aviso",
            description: "Como owner, deve transferir o ownership antes de sair ou eliminar a família",
            variant: "destructive"
          });
          return;
        }
      }

      // Para outros roles, permitir sair
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', currentFamily.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Saiu da Família",
        description: `Saiu da família "${currentFamily.nome}" com sucesso`,
      });

      // Remover estado
      // setCurrentFamily(null); // já é feito pelo hook
      // setFamilyMembers([]); // já é feito pelo hook
      setUserRole('viewer');

    } catch (error: any) {
      console.error('Erro ao sair da família:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao sair da família",
        variant: "destructive"
      });
    }
  };

  const transferOwnership = async (memberId: string, memberName?: string) => {
    if (!currentFamily || userRole !== 'owner') return;

    try {
      // Verificar se o membro existe
      const memberToTransfer = familyMembers.find(m => m.id === memberId);
      if (!memberToTransfer) {
        toast({
          title: "Erro",
          description: "Membro não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Atualizar o role do novo owner
      const { error: updateError } = await supabase
        .from('family_members')
        .update({ role: 'owner' })
        .eq('id', memberId);

      if (updateError) throw updateError;

      // Atualizar o role do owner atual para admin
      const { error: demoteError } = await supabase
        .from('family_members')
        .update({ role: 'admin' })
        .eq('user_id', user?.id)
        .eq('family_id', currentFamily.id);

      if (demoteError) throw demoteError;

      toast({
        title: "Ownership Transferido",
        description: `${memberName || 'O membro'} é agora o owner da família`,
      });

      await loadFamilyData();
      await loadFamilyMembers();

    } catch (error: any) {
      console.error('Erro ao transferir ownership:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao transferir ownership da família",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'member': return <Users className="h-4 w-4 text-green-600" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-600" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
      case 'viewer': return 'Visualizador';
      default: return 'Membro';
    }
  };

  const canInviteMembers = ['owner', 'admin'].includes(userRole);
  const canManageMembers = ['owner', 'admin'].includes(userRole);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              {currentFamily ? currentFamily.nome : 'Gestão Familiar'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentFamily 
                ? 'Gerir membros e configurações da família' 
                : 'Crie ou junte-se a uma família para partilhar finanças'
              }
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshManual}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </Button>
        </div>



        {/* Convites Recebidos */}
        {pendingInvitesForUser.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Mail className="h-5 w-5" />
                Convites Recebidos ({pendingInvitesForUser.length})
              </CardTitle>
              <CardDescription>
                Tem convites pendentes para participar em famílias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingInvitesForUser.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div>
                    <p className="font-medium">Convite para família</p>
                    <p className="text-sm text-muted-foreground">
                      Função: {getRoleLabel(invite.role)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira em: {format(new Date(invite.expires_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => acceptInvite(invite.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => declineInvite(invite.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {currentFamily ? (
          <Tabs defaultValue="members" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">Membros</TabsTrigger>
              <TabsTrigger value="invites">Convites</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <div className="space-y-6">
                {/* Estatísticas dos Membros */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Estatísticas dos Membros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{familyMembers.length}</div>
                        <div className="text-sm text-muted-foreground">Total de Membros</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {familyMembers.filter(m => m.role === 'owner').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Owner</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {familyMembers.filter(m => m.role === 'admin').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Admins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {familyMembers.filter(m => ['member', 'viewer'].includes(m.role)).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Membros</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Convitar novo membro */}
                {canInviteMembers && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Convidar Membro
                      </CardTitle>
                      <CardDescription>
                        Adicione novos membros à sua família
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="invite-email">Email</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Função</Label>
                          <select
                            id="invite-role"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'member' | 'viewer')}
                            className="w-full px-3 py-2 border border-input rounded-md"
                          >
                            <option value="member">Membro</option>
                            <option value="viewer">Visualizador</option>
                          </select>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          inviteMember(inviteEmail, inviteRole);
                          setInviteEmail("");
                        }}
                        disabled={inviteLoading || !inviteEmail.trim()}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {inviteLoading ? 'A enviar...' : 'Enviar Convite'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Lista de membros */}
                <Card>
                  <CardHeader>
                    <CardTitle>Membros da Família ({familyMembers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {member.profiles?.nome?.substring(0, 2)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.profiles?.nome || 'Utilizador'}</p>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(member.role)}
                                <span className="text-sm text-muted-foreground">
                                  {getRoleLabel(member.role)}
                                </span>
                                {member.user_id === user?.id && (
                                  <Badge variant="outline" className="text-xs">Você</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Membro desde {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: pt })}
                              </p>
                            </div>
                          </div>
                          
                          {canManageMembers && member.role !== 'owner' && member.user_id !== user?.id && (
                            <div className="flex items-center gap-2">
                              {/* Dropdown para alterar role */}
                              <select
                                value={member.role}
                                onChange={(e) => updateMemberRole(member.id, e.target.value as 'admin' | 'member' | 'viewer')}
                                className="text-xs px-2 py-1 border rounded bg-background"
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Membro</option>
                                <option value="viewer">Visualizador</option>
                              </select>
                              
                              {/* Botão remover */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem a certeza que quer remover <strong>{member.profiles?.nome || 'este membro'}</strong> da família?
                                      <br />
                                      <br />
                                      <span className="text-sm text-muted-foreground">
                                        Esta ação não pode ser desfeita. O membro perderá acesso a todas as transações e dados da família.
                                      </span>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeMember(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remover Membro
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                          
                          {/* Botão para transferir ownership (apenas para owner) */}
                          {userRole === 'owner' && member.role !== 'owner' && member.user_id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                  <Crown className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Transferir Ownership</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem a certeza que quer transferir o ownership da família para <strong>{member.profiles?.nome || 'este membro'}</strong>?
                                    <br />
                                    <br />
                                    <span className="text-sm text-muted-foreground">
                                      Você passará a ser admin e {member.profiles?.nome || 'este membro'} será o novo owner da família.
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => transferOwnership(member.id, member.profiles?.nome)}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                  >
                                    Transferir Ownership
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {/* Mostrar informação se não pode ser removido */}
                          {(!canManageMembers || member.role === 'owner' || member.user_id === user?.id) && (
                            <div className="text-xs text-muted-foreground">
                              {member.role === 'owner' && 'Owner da família'}
                              {member.user_id === user?.id && 'Você mesmo'}
                              {!canManageMembers && 'Sem permissão'}
                            </div>
                          )}
                          
                          {/* Botão Sair da Família para o próprio utilizador */}
                          {member.user_id === user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                  <Users className="h-4 w-4 mr-1" />
                                  Sair
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sair da Família</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem a certeza que quer sair da família <strong>"{currentFamily?.nome}"</strong>?
                                    <br />
                                    <br />
                                    <span className="text-sm text-muted-foreground">
                                      {userRole === 'owner' 
                                        ? "Como owner, deve transferir o ownership antes de sair ou eliminar a família completamente."
                                        : "Perderá acesso a todas as transações e dados da família."
                                      }
                                    </span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={leaveFamily}
                                    className="bg-orange-600 text-white hover:bg-orange-700"
                                  >
                                    Sair da Família
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="invites">
              <Card>
                <CardHeader>
                  <CardTitle>Convites Pendentes ({pendingInvites.length})</CardTitle>
                  <CardDescription>
                    Convites enviados que ainda aguardam resposta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingInvites.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum convite pendente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                Enviado {format(new Date(invite.created_at), 'dd/MM/yyyy', { locale: pt })}
                              </span>
                              <Badge variant="outline">{getRoleLabel(invite.role)}</Badge>
                            </div>
                          </div>
                          
                          {canManageMembers && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => declineInvite(invite.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Configurações da Família */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configurações da Família
                    </CardTitle>
                    <CardDescription>
                      Gerir as definições e permissões da família
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="family-name">Nome da Família</Label>
                        <Input
                          id="family-name"
                          value={currentFamily.nome}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="family-created">Criada em</Label>
                        <Input
                          id="family-created"
                          value={format(new Date(currentFamily.created_at), 'dd/MM/yyyy', { locale: pt })}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Permissões da Família</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Ver todas as transações</p>
                            <p className="text-xs text-muted-foreground">Membros podem ver transações de outros</p>
                          </div>
                          <Badge variant={currentFamily.settings.allow_view_all ? "default" : "secondary"}>
                            {currentFamily.settings.allow_view_all ? "Ativado" : "Desativado"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Adicionar transações</p>
                            <p className="text-xs text-muted-foreground">Membros podem adicionar transações</p>
                          </div>
                          <Badge variant={currentFamily.settings.allow_add_transactions ? "default" : "secondary"}>
                            {currentFamily.settings.allow_add_transactions ? "Ativado" : "Desativado"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Aprovação obrigatória</p>
                            <p className="text-xs text-muted-foreground">Transações requerem aprovação</p>
                          </div>
                          <Badge variant={currentFamily.settings.require_approval ? "default" : "secondary"}>
                            {currentFamily.settings.require_approval ? "Ativado" : "Desativado"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações Perigosas */}
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Zona Perigosa</CardTitle>
                    <CardDescription>
                      Ações irreversíveis que afetam a família
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sair da Família - Para todos os roles */}
                    <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div>
                        <h4 className="font-medium text-orange-800">Sair da Família</h4>
                        <p className="text-sm text-orange-600">
                          {userRole === 'owner' 
                            ? "Remover-se da família (deve transferir ownership primeiro)"
                            : "Remover-se como membro desta família"
                          }
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-orange-300 text-orange-700">
                            Sair da Família
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sair da Família?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {userRole === 'owner' 
                                ? `Como owner da família "${currentFamily.nome}", deve transferir o ownership antes de sair ou eliminar a família completamente.`
                                : `Tem a certeza que quer sair da família "${currentFamily.nome}"? Perderá acesso a todas as transações e dados familiares.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={leaveFamily} 
                              className="bg-orange-600 hover:bg-orange-700"
                              disabled={userRole === 'owner'}
                            >
                              Sair da Família
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Transferir Ownership - Apenas para owner */}
                    {userRole === 'owner' && (
                      <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div>
                          <h4 className="font-medium text-blue-800">Transferir Ownership</h4>
                          <p className="text-sm text-blue-600">
                            Transferir a posse da família para outro membro
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="border-blue-300 text-blue-700"
                          onClick={() => {
                            // Mostrar lista de membros para transferir ownership
                            const otherMembers = familyMembers.filter(m => m.user_id !== user?.id);
                            if (otherMembers.length === 0) {
                              toast({
                                title: "Sem Membros",
                                description: "Não há outros membros para transferir o ownership",
                                variant: "destructive"
                              });
                            } else {
                              // Aqui poderia abrir um modal para selecionar o membro
                              toast({
                                title: "Transferir Ownership",
                                description: "Use o botão de coroa na lista de membros para transferir ownership",
                              });
                            }
                          }}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Transferir Ownership
                        </Button>
                      </div>
                    )}

                    {/* Eliminar Família - Apenas para owner */}
                    {userRole === 'owner' && (
                      <div className="flex items-center justify-between p-4 border border-destructive rounded-lg bg-destructive/5">
                        <div>
                          <h4 className="font-medium text-destructive">Eliminar Família</h4>
                          <p className="text-sm text-destructive/80">
                            Eliminar permanentemente a família e todos os dados
                          </p>
                        </div>
                        <AlertDialog open={showDeleteFamily} onOpenChange={setShowDeleteFamily}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              Eliminar Família
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar Família?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é <strong>irreversível</strong>. A família "{currentFamily.nome}" 
                                e todos os dados associados (membros, convites, transações) serão eliminados permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={deleteFamily} className="bg-destructive">
                                Sim, Eliminar Família
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Criar nova família
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Criar Família
              </CardTitle>
              <CardDescription>
                Crie uma família para partilhar finanças com outros membros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="family-name">Nome da Família</Label>
                <Input
                  id="family-name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Ex: Família Silva"
                />
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  🏠 Vantagens da Família
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Partilhar transações e metas entre membros</li>
                  <li>• Visão geral das finanças familiares</li>
                  <li>• Controlo de permissões por função</li>
                  <li>• Relatórios conjuntos e individuais</li>
                </ul>
              </div>

              <Button 
                onClick={createFamily} 
                disabled={createLoading || !familyName.trim()}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                {createLoading ? 'A criar...' : 'Criar Família'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}; 