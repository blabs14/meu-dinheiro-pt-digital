import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, RefreshCw, Settings } from 'lucide-react';

export const SimpleFamilyManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [familyName, setFamilyName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFamily();
    }
  }, [user]);

  const loadFamily = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 SimpleFamilyManager - Carregando família para:', user.id);

      const { data, error } = await supabase
        .rpc('get_user_family_data', { p_user_id: user.id });

      console.log('🔍 SimpleFamilyManager - Resposta:', { data, error });

      if (error) {
        console.error('❌ Erro:', error);
        setCurrentFamily(null);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const response = data[0] as any;
        if (response.family) {
          setCurrentFamily(response.family);
          console.log('✅ SimpleFamilyManager - Família encontrada:', response.family.nome);
        }
      } else {
        setCurrentFamily(null);
      }

    } catch (error: any) {
      console.error('❌ Erro ao carregar família:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    if (!user || !familyName.trim()) return;

    setCreateLoading(true);
    try {
      const { data: familyId, error } = await supabase
        .rpc('create_family_direct', {
          p_family_name: familyName.trim(),
          p_user_id: user.id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Família Criada! 🎉",
        description: `A família "${familyName}" foi criada com sucesso.`,
      });

      setFamilyName('');
      await loadFamily(); // Recarregar dados

    } catch (error: any) {
      console.error('Erro ao criar família:', error);
      toast({
        title: "Erro ao Criar Família",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
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
        <Button variant="outline" size="sm" onClick={loadFamily}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {currentFamily ? (
        // Família existente
        <Card>
          <CardHeader>
            <CardTitle>Sua Família: {currentFamily.nome}</CardTitle>
            <CardDescription>
              Criado em {new Date(currentFamily.created_at).toLocaleDateString('pt-PT')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Família Ativa</h3>
                <p className="text-green-700 text-sm">
                  Você faz parte da família "{currentFamily.nome}".
                </p>
                <p className="text-green-600 text-xs mt-1">
                  ID: {currentFamily.id}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">👥 Gestão de Membros</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Convide novos membros ou gerir permissões
                  </p>
                  <p className="text-xs text-orange-600">
                    Em desenvolvimento
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">⚙️ Configurações</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alterar nome, descrição e preferências
                  </p>
                  <p className="text-xs text-orange-600">
                    Em desenvolvimento
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <p>• Funcionalidades avançadas estão em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 