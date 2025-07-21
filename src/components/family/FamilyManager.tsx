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
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<FamilyData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<FamilyInvite[]>([]);
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadFamilyData();
      loadUserPendingInvites();
    }
  }, [user]);

  // Função para refresh manual
  const handleRefresh = async () => {
    setRefreshing(true);
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
      setRefreshing(false);
    }
  };

  const loadFamilyData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Primeiro tentar usar função SQL nativa
      const { data: familyData, error: familyError } = await supabase
        .rpc('get_user_family_data', { p_user_id: user.id });

      if (familyError) {
        console.warn('⚠️ Função SQL falhou, usando query direta:', familyError);
        
        // Fallback: Query direta
        const { data: memberData, error: memberError } = await supabase
          .from('family_members')
          .select(`
            family_id,
            role,
            families!inner (
              id,
              nome,
              description,
              created_by,
              created_at,
              updated_at,
              settings
            )
          `)
          .eq('user_id', user.id)
          .limit(1);

        if (memberError) throw memberError;

        if (memberData && memberData.length > 0) {
          const member = memberData[0];
          setCurrentFamily(member.families as FamilyData);
          setUserRole(member.role);
        } else {
          setCurrentFamily(null);
          setUserRole('member');
        }
      } else if (familyData && Array.isArray(familyData) && familyData.length > 0) {
        const familyResponse = familyData[0] as unknown as {
          family: FamilyData;
          family_member: FamilyMember;
        };
        console.log('🔍 Debug - Resposta da função:', familyResponse);
        
        if (familyResponse.family && familyResponse.family_member) {
          const family = familyResponse.family;
          const member = familyResponse.family_member;
          
          console.log('🔍 FamilyManager - Dados encontrados:', { family, member });
          
          setCurrentFamily({
            id: family.id,
            nome: family.nome,
            description: family.description,
            created_by: family.created_by,
            created_at: family.created_at,
            updated_at: family.updated_at,
            settings: family.settings || {
              allow_view_all: true,
              allow_add_transactions: true,
              require_approval: false
            }
          });
          setUserRole(member.role);
          
          console.log('✅ FamilyManager - Família definida:', family.nome);
          
          // Carregar membros da família
          await loadFamilyMembers(family.id);
        } else {
          setCurrentFamily(null);
          setUserRole('member');
        }
      } else {
        setCurrentFamily(null);
        setUserRole('member');
      }
    } catch (error: unknown) {
      console.error('❌ Erro ao carregar dados da família:', error);
      // Não mostrar toast de erro aqui para evitar spam
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    try {
      // Tentar função SQL primeiro
      const { data: membersData, error: membersError } = await supabase
        .rpc('get_family_members_with_profiles', { p_family_id: familyId });

      if (membersError) {
        console.warn('⚠️ Função SQL para membros falhou, usando query direta:', membersError);
        
        // Fallback: Query direta simples sem relacionamentos
        const { data: directMembers, error: directError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyId);

        if (directError) throw directError;
        
        // Mapear para o formato esperado
        const processedMembers = (directMembers || []).map((member: any) => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member' | 'viewer',
          profiles: { nome: 'Utilizador', email: '' }
        }));
        
        setFamilyMembers(processedMembers);
      } else if (Array.isArray(membersData)) {
        const processedMembers = membersData.map((member: any) => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member' | 'viewer',
          profiles: member.profiles || { nome: 'Utilizador', email: '' }
        }));
        setFamilyMembers(processedMembers);
      }

      // Carregar convites pendentes
      const { data: invites, error: invitesError } = await supabase
        .from('family_invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString());

      if (invitesError) throw invitesError;
      
      const processedInvites = (invites || []).map((invite: any) => ({
        ...invite,
        status: invite.status as 'pending' | 'accepted' | 'declined'
      }));
      
      setPendingInvites(processedInvites);

    } catch (error) {
      console.error('❌ Erro ao carregar membros:', error);
    }
  };

  const loadUserPendingInvites = async () => {
    if (!user?.email) return;

    try {
      console.log('🔍 Debug - Carregando convites para email:', user.email);
      
      const { data: invites, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      console.log('🔍 Debug - Resultado da query:', { invites, error });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }
      
      const processedInvites = (invites || []).map(invite => ({
        ...invite,
        status: invite.status as 'pending' | 'accepted' | 'declined'
      }));
      
      console.log('🔍 Debug - Convites processados:', processedInvites);
      
      setPendingInvitesForUser(processedInvites);
      
      // Mostrar notificação se encontrar convites
      if (processedInvites.length > 0) {
        toast({
          title: `${processedInvites.length} convite(s) pendente(s)`,
          description: "Tem convites para participar em famílias",
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar convites do utilizador:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convites pendentes",
        variant: "destructive"
      });
    }
  };

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

  const inviteMember = async () => {
    if (!user || !currentFamily || !inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const emailToInvite = inviteEmail.trim().toLowerCase();

      // Verificar se já existe um convite pendente para este email
      const { data: existingInvite, error: inviteCheckError } = await supabase
        .from('family_invites')
        .select('id')
        .eq('family_id', currentFamily.id)
        .eq('email', emailToInvite)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString());

      if (inviteCheckError && inviteCheckError.code !== 'PGRST116') {
        throw inviteCheckError;
      }

      if (existingInvite && existingInvite.length > 0) {
        toast({
          title: "Convite Já Existe",
          description: "Já existe um convite pendente para este email",
          variant: "destructive"
        });
        return;
      }

      // Criar convite
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

      const { error: inviteError } = await supabase
        .from('family_invites')
        .insert({
          family_id: currentFamily.id,
          email: emailToInvite,
          role: inviteRole,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;

      toast({
        title: "Convite Enviado! 📧",
        description: `Convite enviado para ${emailToInvite}`,
      });

      // Recarregar convites pendentes
      await loadFamilyMembers(currentFamily.id); // Use loadFamilyMembers para atualizar a lista de convites
      setInviteEmail('');

    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro ao Enviar Convite",
        description: error.message || "Não foi possível enviar o convite",
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    if (!user) return;

    try {
      const { data: result, error } = await supabase
        .rpc('accept_family_invite_by_email', {
          p_email: user.email?.toLowerCase() || '',
          p_user_id: user.id
        });

      if (error) throw error;

      const response = result as any;
      if (response?.success) {
        toast({
          title: "Convite Aceite! 🎉",
          description: response.message,
        });

        // Recarregar dados
        await loadFamilyData();
        await loadUserPendingInvites();
      } else {
        toast({
          title: "Erro",
          description: response?.message || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao Aceitar Convite",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Convite Recusado",
        description: "O convite foi recusado",
      });

      await loadUserPendingInvites();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string) => {
    if (!currentFamily) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Membro Removido",
        description: "O membro foi removido da família",
      });

      await loadFamilyMembers(currentFamily.id);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover membro",
        variant: "destructive"
      });
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('family_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Convite Cancelado",
        description: "O convite foi cancelado",
      });

      if (currentFamily) {
        await loadFamilyMembers(currentFamily.id); // Use loadFamilyMembers para atualizar a lista de convites
      }

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar convite",
        variant: "destructive"
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Função Atualizada",
        description: `A função do membro foi alterada para ${getRoleLabel(newRole)}`,
      });

      if (currentFamily) {
        await loadFamilyMembers(currentFamily.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteFamily = async () => {
    if (!currentFamily || !user) return;

    try {
      // Eliminar todos os dados relacionados
      await supabase.from('family_invites').delete().eq('family_id', currentFamily.id);
      await supabase.from('family_members').delete().eq('family_id', currentFamily.id);
      
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', currentFamily.id)
        .eq('created_by', user.id);

      if (error) throw error;

      toast({
        title: "Família Eliminada",
        description: "A família foi eliminada com sucesso",
      });

      // Limpar estado
      setCurrentFamily(null);
      setFamilyMembers([]);
      setPendingInvites([]);
      setUserRole('viewer');
      setShowDeleteFamily(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const leaveFamily = async () => {
    if (!currentFamily || !user) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', currentFamily.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Saiu da Família",
        description: "Saiu da família com sucesso",
      });

      // Limpar estado
      setCurrentFamily(null);
      setFamilyMembers([]);
      setPendingInvites([]);
      setUserRole('viewer');

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
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
            onClick={handleRefresh}
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
                        onClick={inviteMember} 
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
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                              </div>
                            </div>
                          </div>
                          
                          {canManageMembers && member.role !== 'owner' && member.user_id !== user?.id && (
                            <div className="flex items-center gap-2">
                              {/* Dropdown para alterar role */}
                              <select
                                value={member.role}
                                onChange={(e) => updateMemberRole(member.id, e.target.value as 'admin' | 'member' | 'viewer')}
                                className="text-xs px-2 py-1 border rounded"
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Membro</option>
                                <option value="viewer">Visualizador</option>
                              </select>
                              
                              {/* Botão remover */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem a certeza que quer remover este membro da família?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeMember(member.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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
                              onClick={() => cancelInvite(invite.id)}
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
                    {userRole !== 'owner' && (
                      <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <div>
                          <h4 className="font-medium text-orange-800">Sair da Família</h4>
                          <p className="text-sm text-orange-600">
                            Remover-se como membro desta família
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
                                Tem a certeza que quer sair da família "{currentFamily.nome}"? 
                                Perderá acesso a todas as transações e dados familiares.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={leaveFamily} className="bg-orange-600">
                                Sair da Família
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

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