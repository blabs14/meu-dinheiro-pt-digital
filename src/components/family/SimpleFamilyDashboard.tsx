import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SimpleFamilyDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 Carregando dados para user:', user.id);

      const { data, error } = await supabase
        .rpc('get_user_family_data', { p_user_id: user.id });

      console.log('🔍 Resposta:', { data, error });

      if (error) {
        console.error('❌ Erro:', error);
        setCurrentFamily(null);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const response = data[0] as any;
        console.log('🔍 Dados processados:', response);
        
        if (response.family) {
          setCurrentFamily(response.family);
          console.log('✅ Família definida:', response.family.nome);
          toast({
            title: "Família carregada",
            description: `Bem-vindo à ${response.family.nome}`,
          });
        }
      } else {
        console.log('ℹ️ Nenhuma família encontrada');
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar família...</p>
        </div>
      </div>
    );
  }

  if (!currentFamily) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
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
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Gerir Família
          </Button>
        </div>
      </div>

      {/* Info da Família */}
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

      {/* Placeholder para futuras funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades em Desenvolvimento</CardTitle>
          <CardDescription>
            Estas funcionalidades serão adicionadas em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📊 Estatísticas Familiares</h3>
              <p className="text-sm text-muted-foreground">Rendimento, despesas e poupança agregados</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">👥 Membros da Família</h3>
              <p className="text-sm text-muted-foreground">Lista e gestão de membros</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🎯 Metas Familiares</h3>
              <p className="text-sm text-muted-foreground">Objetivos partilhados</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💰 Transações</h3>
              <p className="text-sm text-muted-foreground">Histórico financeiro familiar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 