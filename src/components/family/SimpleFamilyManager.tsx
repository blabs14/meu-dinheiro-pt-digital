import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  RefreshCw,
  Settings,
  Edit,
  Save,
  X,
  Trash2,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

export const SimpleFamilyManager = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    description: '',
    allowViewAll: true,
    allowAddTransactions: true,
    requireApproval: false
  });

  // Estados que faltavam
  const [familyName, setFamilyName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  // Novos estados para múltiplas famílias
  const [userFamilies, setUserFamilies] = useState<any[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [familiesLoading, setFamiliesLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadUserFamilies();
    }
  }, [user, authLoading]);

  // Carregar todas as famílias do utilizador
  const loadUserFamilies = async () => {
    if (!user) return;
    
    setFamiliesLoading(true);
    setLoading(true);
    
    try {
      const { data: familyMembers, error } = await supabase
        .from('family_members')
        .select(`
          family_id,
          role,
          families (*)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar famílias:', error);
        setLoading(false);
        return;
      }

      if (familyMembers && familyMembers.length > 0) {
        const familiesData = familyMembers.map(fm => ({
          ...fm.families,
          userRole: fm.role
        }));
        
        setUserFamilies(familiesData);
        
        // Selecionar a primeira família por padrão
        if (!selectedFamilyId && familiesData.length > 0) {
          setSelectedFamilyId(familiesData[0].id);
          setCurrentFamily(familiesData[0]);
        }
      } else {
        setUserFamilies([]);
        setCurrentFamily(null);
      }
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
      // Limpar estados ao mudar de família
      setEditForm({
        nome: '',
        description: '',
        allowViewAll: true,
        allowAddTransactions: true,
        requireApproval: false
      });
      setPendingInvites([]);
      setCurrentFamily(null);
      // NÃO limpar familyMembers aqui!
      loadFamily();
    }
  }, [selectedFamilyId, user]);

  const loadFamily = async () => {
    if (!selectedFamilyId || !user) return;
    
    console.log('🔍 [SimpleFamilyManager] Carregando dados da família:', selectedFamilyId);
    
    try {
      // Encontrar a família selecionada
      const selectedFamily = userFamilies.find(f => f.id === selectedFamilyId);
      if (!selectedFamily) {
        console.error('Família selecionada não encontrada');
        return;
      }

      setCurrentFamily(selectedFamily);
      
      // Carregar membros da família
      await loadFamilyMembers(selectedFamilyId);
      
      // Carregar convites pendentes
      await loadPendingInvites(selectedFamilyId);
      
      console.log('🔍 [SimpleFamilyManager] Dados da família carregados:', selectedFamily);
    } catch (error) {
      console.error('Erro ao carregar dados da família:', error);
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    setMembersLoading(true);
    try {
      console.log('🔍 [SimpleFamilyManager] A carregar membros para família:', familyId);
      const { data: members, error } = await supabase
        .from('family_members')
        .select(`
          *,
          profiles (nome, email)
        `)
        .eq('family_id', familyId);

      console.log('🔍 [SimpleFamilyManager] Resultado da query membros:', { members, error });

      if (error) {
        console.error('Erro ao carregar membros:', error);
        return;
      }

      setFamilyMembers(members || []);
      console.log('🔍 [SimpleFamilyManager] Estado familyMembers atualizado:', members);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadPendingInvites = async (familyId: string) => {
    setInvitesLoading(true);
    try {
      const { data: invites, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending');

      if (error) {
        console.error('Erro ao carregar convites:', error);
        return;
      }

      setPendingInvites(invites || []);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setInvitesLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!currentFamily || !inviteEmail.trim()) return;

    try {
      setInviteLoading(true);
      
      const { data, error } = await (supabase as any)
        .rpc('invite_family_member_by_email', {
          p_family_id: currentFamily.id,
          p_email: inviteEmail.trim(),
          p_role: inviteRole
        });

      if (error) {
        throw error;
      }

      if (data && (data as any).success) {
        toast({
          title: "Convite enviado! ✅",
          description: `Convite enviado para ${inviteEmail}`,
        });
        
        setInviteEmail('');
        setInviteRole('member');
        await loadPendingInvites(currentFamily.id);
      } else {
        throw new Error((data as any)?.message || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('❌ Erro ao enviar convite:', error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const cancelInvite = async (inviteId: string, email: string) => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('cancel_family_invite', {
          p_invite_id: inviteId
        });

      if (error) {
        throw error;
      }

      if (data && (data as any).success) {
        toast({
          title: "Convite cancelado ✅",
          description: `Convite para ${email} foi cancelado`,
        });
        
        if (currentFamily) {
          await loadPendingInvites(currentFamily.id);
        }
      } else {
        throw new Error((data as any)?.message || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('❌ Erro ao cancelar convite:', error);
      toast({
        title: "Erro ao cancelar convite",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    if (!currentFamily || !user) return;

    try {
      setSaveLoading(true);
      
      const { data, error } = await (supabase as any)
        .rpc('update_family_settings', {
          p_family_id: currentFamily.id,
          p_nome: editForm.nome,
          p_description: editForm.description || null,
          p_settings: {
            allow_view_all: editForm.allowViewAll,
            allow_add_transactions: editForm.allowAddTransactions,
            require_approval: editForm.requireApproval
          }
        });

      if (error) {
        throw error;
      }

      if (data && (data as any).success) {
        toast({
          title: "Configurações guardadas! ✅",
          description: "As configurações da família foram atualizadas com sucesso.",
        });
        
        setEditingSettings(false);
        await loadFamily(); // Recarregar dados
              } else {
        throw new Error((data as any)?.message || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('❌ Erro ao guardar configurações:', error);
      toast({
        title: "Erro ao guardar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const removeMember = async (memberUserId: string, memberName: string) => {
    if (!currentFamily) return;

    try {
      const { data, error } = await (supabase as any)
        .rpc('remove_family_member', {
          p_family_id: currentFamily.id,
          p_member_user_id: memberUserId
        });

      if (error) {
        throw error;
      }

      if (data && (data as any).success) {
        toast({
          title: "Membro removido ✅",
          description: `${memberName} foi removido da família.`,
        });
        
        await loadFamilyMembers(currentFamily.id);
              } else {
        throw new Error((data as any)?.message || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('❌ Erro ao remover membro:', error);
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateMemberRole = async (memberUserId: string, newRole: string, memberName: string) => {
    if (!currentFamily) return;

    try {
      const { data, error } = await (supabase as any)
        .rpc('update_member_role', {
          p_family_id: currentFamily.id,
          p_member_user_id: memberUserId,
          p_new_role: newRole
        });

      if (error) {
        throw error;
      }

      if (data && (data as any).success) {
        toast({
          title: "Papel atualizado ✅",
          description: `O papel de ${memberName} foi alterado para ${getRoleDisplayName(newRole)}.`,
        });
        
        await loadFamilyMembers(currentFamily.id);
              } else {
        throw new Error((data as any)?.message || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('❌ Erro ao atualizar papel:', error);
      toast({
        title: "Erro ao atualizar papel",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createFamily = async () => {
    if (!user || !familyName.trim()) return;

    setCreateLoading(true);
    try {
      console.log('🔍 SimpleFamilyManager - Criando família:', familyName);
      
      const { data: familyId, error } = await supabase
        .rpc('create_family_direct', {
          p_family_name: familyName.trim(),
          p_user_id: user.id
        });

      if (error) {
        throw error;
      }

      console.log('✅ SimpleFamilyManager - Família criada com ID:', familyId);
      
      toast({
        title: "Família Criada! 🎉",
        description: `A família "${familyName}" foi criada com sucesso.`,
      });

      setFamilyName('');
      await loadFamily(); // Recarregar dados

    } catch (error: any) {
      console.error('❌ SimpleFamilyManager - Erro ao criar família:', error);
      toast({
        title: "Erro ao Criar Família",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Dono';
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'owner': return 'destructive';
      case 'admin': return 'default';
      case 'member': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const isOwner = currentFamily && familyMembers.find(m => m.user_id === user?.id)?.role === 'owner';
  const userRole = currentFamily && familyMembers.find(m => m.user_id === user?.id)?.role;

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
    
    // Recarregar famílias
    await loadUserFamilies();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold">Não Autenticado</h3>
        <p className="text-muted-foreground">Faça login para gerir famílias</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestão da Família
          </h2>
          <p className="text-muted-foreground mt-1">
            Crie ou gerir a sua família
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">A carregar dados da família...</p>
            </div>
          </CardContent>
        </Card>
      ) : currentFamily ? (
        <>
          {/* Configurações da Família */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações da Família
              </CardTitle>
              <CardDescription>
                Edite as configurações básicas da família
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Seletor de Família */}
              {userFamilies.length > 1 && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Selecionar Família para Configurar:
                  </label>
                  <select
                    value={selectedFamilyId}
                    onChange={(e) => {
                      const familyId = e.target.value;
                      setSelectedFamilyId(familyId);
                    }}
                    className="w-full max-w-xs p-2 border rounded-md bg-background"
                  >
                    {userFamilies.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.nome} ({family.userRole})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingSettings && isOwner ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="family-name-edit">Nome da Família</Label>
                    <Input
                      id="family-name-edit"
                      value={editForm.nome}
                      onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                      placeholder="Nome da família"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="family-description-edit">Descrição</Label>
                    <Textarea
                      id="family-description-edit"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Descrição da família (opcional)"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Preferências</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allow-view-all">Permitir ver todas as transações</Label>
                        <p className="text-sm text-muted-foreground">Membros podem ver transações de outros membros</p>
                      </div>
                      <Switch
                        id="allow-view-all"
                        checked={editForm.allowViewAll}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, allowViewAll: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allow-add-transactions">Permitir adicionar transações</Label>
                        <p className="text-sm text-muted-foreground">Membros podem adicionar suas próprias transações</p>
                      </div>
                      <Switch
                        id="allow-add-transactions"
                        checked={editForm.allowAddTransactions}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, allowAddTransactions: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="require-approval">Requerer aprovação</Label>
                        <p className="text-sm text-muted-foreground">Transações precisam de aprovação do administrador</p>
                      </div>
                      <Switch
                        id="require-approval"
                        checked={editForm.requireApproval}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, requireApproval: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={saveSettings}
                      disabled={saveLoading}
                    >
                      {saveLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          A guardar...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Alterações
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingSettings(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Nome: {currentFamily.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentFamily.description || 'Sem descrição'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">Configurações:</p>
                    <div className="space-y-1 text-sm">
                      <p>• Ver todas as transações: {currentFamily.settings?.allow_view_all ? '✅ Sim' : '❌ Não'}</p>
                      <p>• Adicionar transações: {currentFamily.settings?.allow_add_transactions ? '✅ Sim' : '❌ Não'}</p>
                      <p>• Requerer aprovação: {currentFamily.settings?.require_approval ? '✅ Sim' : '❌ Não'}</p>
                    </div>
                  </div>
                  
                  {isOwner ? (
                    <Button
                      variant="outline"
                      onClick={() => setEditingSettings(true)}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Configurações
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Apenas o dono da família pode editar estas configurações.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sair da Família */}
          <Card className="border-orange-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Users className="h-5 w-5" />
                Sair da Família
              </CardTitle>
              <CardDescription>
                Esta ação irá remover o seu acesso a todos os dados e transações desta família.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-orange-500 text-orange-700 font-bold w-full flex items-center gap-2 justify-center"
                onClick={() => handleLeaveFamily(selectedFamilyId)}
                disabled={currentFamily?.userRole === 'owner' && familyMembers.filter(m => m.user_id !== user?.id).length > 0}
              >
                <Users className="h-4 w-4" />
                Sair da Família Atual
              </Button>
              {currentFamily?.userRole === 'owner' && familyMembers.filter(m => m.user_id !== user?.id).length > 0 && (
                <div className="text-red-600 text-xs mt-2 text-center">
                  ⚠️ Como owner, deve transferir o ownership antes de sair da família.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestão de Membros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Membros da Família
              </CardTitle>
              <CardDescription>
                Veja e gerir os membros da sua família
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">A carregar membros...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de Membros */}
                  <div className="grid gap-3">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{member.profile?.nome || 'Utilizador'}</p>
                              <Badge variant={getRoleBadgeVariant(member.role)}>
                                {getRoleDisplayName(member.role)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                          </div>
                          
                          {isOwner && member.role !== 'owner' && (
                            <div className="flex items-center gap-2 ml-4">
                              <Select
                                value={member.role}
                                onValueChange={(newRole) => updateMemberRole(member.user_id, newRole, member.profile?.nome)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="member">Membro</SelectItem>
                                  <SelectItem value="viewer">Visualizador</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover membro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem a certeza que quer remover {member.profile?.nome} da família? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeMember(member.user_id, member.profile?.nome)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Convites Pendentes */}
                  {pendingInvites.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Convites Pendentes</h4>
                      <div className="space-y-2">
                        {pendingInvites.map((invite) => (
                          <div key={invite.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{invite.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {getRoleDisplayName(invite.role)} • Expira em {new Date(invite.expires_at).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                            {isOwner && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelInvite(invite.id, invite.email)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Convidar Novo Membro */}
                  {isOwner && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Convidar Novo Membro
                      </h4>
                      <div className="space-y-3">
                        <div>
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
                          <Label htmlFor="invite-role">Papel</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button
                          onClick={inviteMember}
                          disabled={inviteLoading || !inviteEmail.trim()}
                          className="w-full"
                        >
                          {inviteLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              A enviar...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Enviar Convite
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Criar família
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Família</CardTitle>
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
                className="mt-1"
              />
            </div>
            <Button 
              onClick={createFamily}
              disabled={createLoading || !familyName.trim()}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {createLoading ? 'A criar...' : 'Criar Família'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informação */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Informação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Uma família permite partilhar transações e metas entre membros</p>
            <p>• O criador da família torna-se automaticamente o administrador</p>
            <p>• Apenas o dono pode alterar configurações e gerir membros</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 