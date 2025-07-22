import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Trash2, Eye, EyeOff, Save } from 'lucide-react';

interface ProfileData {
  nome: string;
  email: string;
  percentual_divisao: number;
  poupanca_mensal: number;
}

export const ProfileSettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    nome: '',
    email: user?.email || '',
    percentual_divisao: 50,
    poupanca_mensal: 20
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('nome, percentual_divisao, poupanca_mensal')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profile) {
        setProfileData({
          nome: profile.nome || '',
          email: user.email || '',
          percentual_divisao: profile.percentual_divisao || 50,
          poupanca_mensal: profile.poupanca_mensal || 20
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil",
        variant: "destructive"
      });
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Atualizar metadados do auth se o nome mudou
      if (profileData.nome !== user.user_metadata?.nome) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { nome: profileData.nome }
        });

        if (authError) throw authError;
      }

      // Atualizar perfil na base de dados
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          nome: profileData.nome,
          percentual_divisao: profileData.percentual_divisao,
          poupanca_mensal: profileData.poupanca_mensal
        });

      if (profileError) throw profileError;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As palavras-passe não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A palavra-passe deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Palavra-passe alterada com sucesso",
      });

      // Limpar campos
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar palavra-passe",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Eliminar dados do utilizador primeiro
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user!.id);

      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user!.id);

      const { error: goalsError } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', user!.id);

      const { error: expensesError } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('user_id', user!.id);

      // Nota: A eliminação da conta de autenticação requer privilégios de admin
      // Por agora, apenas removemos os dados e fazemos logout
      await signOut();

      toast({
        title: "Conta eliminada",
        description: "Os seus dados foram removidos com sucesso",
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao eliminar conta",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize as suas informações pessoais e preferências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={profileData.nome}
                onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                placeholder="O seu nome"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O email não pode ser alterado
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="divisao">Divisão de Despesas (%)</Label>
              <Input
                id="divisao"
                type="number"
                min="0"
                max="100"
                value={profileData.percentual_divisao}
                onChange={(e) => setProfileData({ ...profileData, percentual_divisao: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Que percentagem das despesas partilhadas paga?
              </p>
            </div>
            
            <div>
              <Label htmlFor="poupanca">Meta de Poupança Mensal (%)</Label>
              <Input
                id="poupanca"
                type="number"
                min="0"
                max="100"
                value={profileData.poupanca_mensal}
                onChange={(e) => setProfileData({ ...profileData, poupanca_mensal: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentagem do rendimento a poupar mensalmente
              </p>
            </div>
          </div>

          <Button onClick={handleProfileUpdate} disabled={loading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Alterar Palavra-passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Altere a sua palavra-passe de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password">Nova Palavra-passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirmar Nova Palavra-passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Repita a nova palavra-passe"
            />
          </div>

          <Button 
            onClick={handlePasswordChange} 
            disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
            className="w-full md:w-auto"
          >
            <Lock className="h-4 w-4 mr-2" />
            {passwordLoading ? 'A alterar...' : 'Alterar Palavra-passe'}
          </Button>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam a sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 rounded-lg p-4">
            <h4 className="font-medium text-destructive mb-2">Eliminar Conta</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação irá eliminar permanentemente todos os seus dados, incluindo transações, metas e configurações. 
              Esta operação não pode ser desfeita.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá eliminar permanentemente a sua conta e todos os dados associados. 
                    Não será possível recuperar estas informações.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    Sim, eliminar conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 