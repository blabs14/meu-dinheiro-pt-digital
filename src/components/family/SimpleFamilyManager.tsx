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
import { Users, UserPlus, RefreshCw, Settings, Edit, Save, X, Trash2, ShieldCheck } from 'lucide-react';
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

export const SimpleFamilyManager = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [familyName, setFamilyName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  
  // Estados para edição de configurações
  const [editingSettings, setEditingSettings] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    description: '',
    allowViewAll: true,
    allowAddTransactions: true,
    requireApproval: false
  });
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Estados para gestão de membros
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔍 SimpleFamilyManager - User carregado, iniciando loadFamily');
      loadFamily();
    } else {
      console.log('🔍 SimpleFamilyManager - User ainda não carregado ou authLoading:', { user: !!user, authLoading });
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadFamily = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 SimpleFamilyManager - === INÍCIO DO CARREGAMENTO ===');
      console.log('🔍 SimpleFamilyManager - User ID:', user.id);
      console.log('🔍 SimpleFamilyManager - User Email:', user.email);

      const { data, error } = await supabase
        .rpc('get_user_family_data', { p_user_id: user.id });

      console.log('🔍 SimpleFamilyManager - === RESPOSTA DO SUPABASE ===');
      console.log('🔍 SimpleFamilyManager - Data:', data);
      console.log('🔍 SimpleFamilyManager - Error:', error);
      console.log('🔍 SimpleFamilyManager - Data JSON:', JSON.stringify(data, null, 2));
      
      setDebugData({ data, error });

      if (error) {
        console.error('❌ SimpleFamilyManager - Erro:', error);
        setCurrentFamily(null);
        return;
      }

      // Processar resposta
      if (data) {
        console.log('🔍 SimpleFamilyManager - === PROCESSAMENTO DOS DADOS ===');
        
        // A função agora retorna diretamente um array com os dados
        if (Array.isArray(data) && data.length > 0) {
          const familyInfo = data[0] as any;
          console.log('🔍 SimpleFamilyManager - Family info:', familyInfo);
          
          if (familyInfo && familyInfo.family) {
            console.log('✅ SimpleFamilyManager - FAMÍLIA ENCONTRADA:', familyInfo.family);
            setCurrentFamily(familyInfo.family);
            
            // Preencher formulário de edição com dados atuais
            const family = familyInfo.family;
            setEditForm({
              nome: family.nome || '',
              description: family.description || '',
              allowViewAll: family.settings?.allow_view_all ?? true,
              allowAddTransactions: family.settings?.allow_add_transactions ?? true,
              requireApproval: family.settings?.require_approval ?? false
            });
            
            // Carregar membros da família
            loadFamilyMembers(family.id);
          } else {
            console.log('❌ SimpleFamilyManager - Sem dados de família no familyInfo');
            setCurrentFamily(null);
          }
        } else {
          console.log('❌ SimpleFamilyManager - Data não é um array ou está vazio');
          setCurrentFamily(null);
        }
      } else {
        console.log('❌ SimpleFamilyManager - Sem dados na resposta');
        setCurrentFamily(null);
      }

    } catch (error: any) {
      console.error('❌ SimpleFamilyManager - Erro ao carregar família:', error);
    } finally {
      setLoading(false);
      console.log('🔍 SimpleFamilyManager - === FIM DO CARREGAMENTO ===');
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    try {
      setMembersLoading(true);
      const { data, error } = await supabase
        .rpc('get_family_members_with_profiles', { p_family_id: familyId });

      if (error) {
        console.error('❌ Erro ao carregar membros:', error);
        return;
      }

      if (data && (data as any).success && (data as any).members) {
        setFamilyMembers((data as any).members);
      } else {
        setFamilyMembers([]);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar membros:', error);
    } finally {
      setMembersLoading(false);
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações da Família
                  </CardTitle>
                  <CardDescription>
                    Edite as configurações básicas da família
                  </CardDescription>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSettings(!editingSettings)}
                  >
                    {editingSettings ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
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
                      className="flex-1"
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
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
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
                  
                  {!isOwner && (
                    <p className="text-xs text-muted-foreground">
                      Apenas o dono da família pode editar estas configurações.
                    </p>
                  )}
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
                  <div className="space-y-2">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{member.profile?.nome || 'Utilizador'}</p>
                            <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                          </div>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {getRoleDisplayName(member.role)}
                          </Badge>
                        </div>
                        
                        {isOwner && member.role !== 'owner' && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={member.role}
                              onValueChange={(newRole) => updateMemberRole(member.user_id, newRole, member.profile?.nome)}
                            >
                              <SelectTrigger className="w-32">
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
                    ))}
                  </div>
                  
                  {/* Convidar Novo Membro - Em desenvolvimento */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Convidar Novo Membro
                    </h4>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        🚧 Funcionalidade em desenvolvimento
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Em breve poderá convidar novos membros por email
                      </p>
                    </div>
                  </div>
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