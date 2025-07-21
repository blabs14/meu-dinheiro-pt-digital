import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, RefreshCw, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SimpleFamilyDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [debugData, setDebugData] = useState<any>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  // Teste de autenticação
  useEffect(() => {
    console.log('🔍 SimpleFamilyDashboard - User:', user);
    console.log('🔍 SimpleFamilyDashboard - User ID:', user?.id);
    console.log('🔍 SimpleFamilyDashboard - User Email:', user?.email);
    console.log('🔍 SimpleFamilyDashboard - Auth Loading:', authLoading);
  }, [user, authLoading]);

  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔍 User carregado, iniciando loadData');
      loadData();
      loadUserPendingInvites();
    } else {
      console.log('🔍 User ainda não carregado ou authLoading:', { user: !!user, authLoading });
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) {
      console.log('❌ Nenhum utilizador autenticado');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 === INÍCIO DO CARREGAMENTO ===');
      console.log('🔍 User ID:', user.id);
      console.log('🔍 User Email:', user.email);

      const { data, error } = await supabase
        .rpc('get_user_family_data', { p_user_id: user.id });

      console.log('🔍 === RESPOSTA DO SUPABASE ===');
      console.log('🔍 Data:', data);
      console.log('🔍 Error:', error);
      console.log('🔍 Data type:', typeof data);
      console.log('🔍 Data is array:', Array.isArray(data));
      console.log('🔍 Data JSON:', JSON.stringify(data, null, 2));
      
      // Guardar dados para debug
      setDebugData({ data, error });

      if (error) {
        console.error('❌ Erro:', error);
        setCurrentFamily(null);
        toast({
          title: "Erro ao carregar família",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Processar resposta
      if (data) {
        console.log('🔍 === PROCESSAMENTO DOS DADOS ===');
        
        // A função agora retorna diretamente um array com os dados
        if (Array.isArray(data) && data.length > 0) {
          const familyInfo = data[0] as any;
          console.log('🔍 Family info:', familyInfo);
          
          if (familyInfo && familyInfo.family) {
            console.log('✅ FAMÍLIA ENCONTRADA:', familyInfo.family);
            setCurrentFamily(familyInfo.family);
            toast({
              title: "Família carregada",
              description: `Bem-vindo à ${familyInfo.family.nome}`,
            });
          } else {
            console.log('❌ Sem dados de família no familyInfo');
            setCurrentFamily(null);
          }
        } else {
          console.log('❌ Data não é um array ou está vazio');
          setCurrentFamily(null);
        }
      } else {
        console.log('❌ Sem dados na resposta');
        setCurrentFamily(null);
      }

    } catch (error: any) {
      console.error('❌ Erro ao carregar:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('🔍 === FIM DO CARREGAMENTO ===');
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
        await loadData();
        await loadUserPendingInvites();
      } else {
        toast({ title: 'Erro ao aceitar convite', description: data?.message || error?.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro ao aceitar convite', description: error.message, variant: 'destructive' });
    }
  };

  const rejectInvite = async (inviteId: string) => {
    // Opcional: implementar rejeição (pode ser só cancelar no frontend)
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
  };

  // Função de teste manual
  const testManual = async () => {
    console.log('🔍 === TESTE MANUAL ===');
    if (!user) {
      console.log('❌ Sem utilizador');
      return;
    }

    try {
      // Teste 1: Verificar sessão
      const { data: session } = await supabase.auth.getSession();
      console.log('🔍 Sessão:', session);

      // Teste 2: Chamar função diretamente
      const { data, error } = await supabase
        .rpc('get_user_family_data', { p_user_id: user.id });
      
      console.log('🔍 Teste manual - Data:', data);
      console.log('🔍 Teste manual - Error:', error);
      console.log('🔍 Teste manual - Data JSON:', JSON.stringify(data, null, 2));

      // Atualizar debug data
      setDebugData({ data, error });

    } catch (error) {
      console.error('❌ Erro no teste manual:', error);
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
                    <p className="font-medium text-sm">Família: {invite.family_nome}</p>
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

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar família...</p>
        </div>
      ) : currentFamily ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                {currentFamily.nome}
              </h1>
              <p className="text-muted-foreground mt-1">
                Dashboard da família
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Gerir Família
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Família</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Nome:</strong> {currentFamily.nome}</p>
                <p><strong>ID:</strong> {currentFamily.id}</p>
                <p><strong>Criado em:</strong> {new Date(currentFamily.created_at).toLocaleDateString('pt-PT')}</p>
                {currentFamily.description && (
                  <p><strong>Descrição:</strong> {currentFamily.description}</p>
                )}
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