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
  X
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

  useEffect(() => {
    if (user) {
      loadFamilyData();
    }
  }, [user]);

  const loadFamilyData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Verificar se utilizador já pertence a uma família
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select(`
          *,
          families:family_id (id, nome, description, created_by, created_at, settings),
          profiles:user_id (nome)
        `)
        .eq('user_id', user.id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (memberData && memberData.families) {
        setCurrentFamily(memberData.families as FamilyData);
        setUserRole(memberData.role);
        
        // Carregar membros da família
        await loadFamilyMembers(memberData.families.id);
        await loadPendingInvites(memberData.families.id);
      }

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados da família",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    const { data: members, error } = await supabase
      .from('family_members')
      .select(`
        *,
        profiles:user_id (nome)
      `)
      .eq('family_id', familyId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    setFamilyMembers(members || []);
  };

  const loadPendingInvites = async (familyId: string) => {
    const { data: invites, error } = await supabase
      .from('family_invites')
      .select('*')
      .eq('family_id', familyId)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    setPendingInvites(invites || []);
  };

  const createFamily = async () => {
    if (!user || !familyName.trim()) return;

    setCreateLoading(true);
    try {
      // Criar família
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          nome: familyName.trim(),
          created_by: user.id,
          settings: {
            allow_view_all: true,
            allow_add_transactions: true,
            require_approval: false
          }
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // Adicionar criador como owner
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          user_id: user.id,
          family_id: family.id,
          role: 'owner',
          permissions: ['all']
        });

      if (memberError) throw memberError;

      toast({
        title: "Família Criada! 🏡",
        description: `A família "${familyName}" foi criada com sucesso`,
      });

      // Recarregar dados
      await loadFamilyData();
      setFamilyName('');

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar família",
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
      // Verificar se email já está na família
      const { data: existingMember, error: checkError } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', currentFamily.id)
        .eq('user_id', inviteEmail); // Assumindo que é email por agora

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingMember && existingMember.length > 0) {
        toast({
          title: "Erro",
          description: "Este utilizador já é membro da família",
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
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;

      toast({
        title: "Convite Enviado! 📧",
        description: `Convite enviado para ${inviteEmail}`,
      });

      // Recarregar convites pendentes
      await loadPendingInvites(currentFamily.id);
      setInviteEmail('');

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar convite",
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
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
        await loadPendingInvites(currentFamily.id);
      }

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar convite",
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
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Remover
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações da Família
                  </CardTitle>
                  <CardDescription>
                    Configure permissões e preferências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        🔒 Permissões por Função
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p><strong>Proprietário:</strong> Acesso total, pode eliminar família</p>
                        <p><strong>Administrador:</strong> Gerir membros e configurações</p>
                        <p><strong>Membro:</strong> Ver e adicionar transações</p>
                        <p><strong>Visualizador:</strong> Apenas visualizar dados</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                      <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                        ⚠️ Em Desenvolvimento
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        A funcionalidade de partilha familiar está em fase beta. 
                        Brevemente terá acesso a configurações avançadas de privacidade e permissões.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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