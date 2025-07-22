import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Calendar,
  Target,
  CreditCard,
  Shield,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const DataExport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTransactionsCSV = async () => {
    if (!user) return;
    
    setLoading('transactions-csv');
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          valor,
          data,
          tipo,
          modo,
          descricao,
          created_at,
          categories:categoria_id (nome, cor)
        `)
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (error) throw error;

      // Cabeçalhos CSV
      const headers = [
        'Data',
        'Valor (€)',
        'Tipo',
        'Categoria',
        'Modo',
        'Descrição',
        'Data de Criação'
      ];

      // Converter dados para CSV
      const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
          t.data,
          t.valor.toString().replace('.', ','),
          t.tipo,
          t.categories?.nome || 'Sem categoria',
          t.modo,
          `"${t.descricao || ''}"`,
          format(new Date(t.created_at), 'dd/MM/yyyy HH:mm', { locale: pt })
        ].join(','))
      ].join('\n');

      const filename = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8');

      toast({
        title: "Sucesso",
        description: `${transactions.length} transações exportadas para ${filename}`,
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar transações",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const exportGoalsJSON = async () => {
    if (!user) return;
    
    setLoading('goals-json');
    try {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        goals: goals.map(goal => ({
          nome: goal.nome,
          valor_meta: goal.valor_meta,
          valor_atual: goal.valor_atual,
          progresso_percentual: goal.valor_meta > 0 ? (goal.valor_atual / goal.valor_meta * 100).toFixed(1) : 0,
          prazo: goal.prazo,
          created_at: goal.created_at,
          updated_at: goal.updated_at
        }))
      };

      const filename = `metas_${format(new Date(), 'yyyy-MM-dd')}.json`;
      downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');

      toast({
        title: "Sucesso",
        description: `${goals.length} metas exportadas para ${filename}`,
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar metas",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const exportFullData = async () => {
    if (!user) return;
    
    setLoading('full-data');
    try {
      // Buscar todos os dados do utilizador
      const [
        { data: profile },
        { data: transactions },
        { data: goals },
        { data: fixedExpenses }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('transactions').select(`
          valor, data, tipo, modo, descricao, created_at,
          categories:categoria_id (nome, cor)
        `).eq('user_id', user.id).order('data', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('fixed_expenses').select(`
          nome, valor, dia_vencimento, ativa, created_at,
          categories:categoria_id (nome, cor)
        `).eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      const fullExport = {
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profile || null,
        statistics: {
          total_transactions: transactions?.length || 0,
          total_goals: goals?.length || 0,
          total_fixed_expenses: fixedExpenses?.length || 0,
          total_income: transactions?.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0) || 0,
          total_expenses: transactions?.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0) || 0
        },
        data: {
          transactions: transactions || [],
          goals: goals || [],
          fixed_expenses: fixedExpenses || []
        }
      };

      const filename = `meu_dinheiro_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      downloadFile(JSON.stringify(fullExport, null, 2), filename, 'application/json');

      toast({
        title: "Sucesso",
        description: `Backup completo exportado para ${filename}`,
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar dados completos",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const exportOptions = [
    {
      id: 'transactions-csv',
      title: 'Transações (CSV)',
      description: 'Exportar todas as transações em formato CSV para Excel',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      action: exportTransactionsCSV,
      badge: 'Recomendado'
    },
    {
      id: 'goals-json',
      title: 'Metas (JSON)',
      description: 'Exportar metas de poupança em formato JSON',
      icon: <Target className="h-5 w-5" />,
      action: exportGoalsJSON,
      badge: null
    },
    {
      id: 'full-data',
      title: 'Backup Completo (JSON)',
      description: 'Exportar todos os dados incluindo perfil e estatísticas',
      icon: <Database className="h-5 w-5" />,
      action: exportFullData,
      badge: 'Backup'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Informações sobre Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre a Exportação de Dados
          </CardTitle>
          <CardDescription>
            Exporte os seus dados financeiros para backup ou uso noutras aplicações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 Formatos Disponíveis
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>CSV:</strong> Ideal para Excel e Google Sheets</li>
              <li>• <strong>JSON:</strong> Formato estruturado para desenvolvimento</li>
              <li>• <strong>Backup:</strong> Arquivo completo para restauro</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Opções de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Escolha o tipo de dados e formato que deseja exportar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exportOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {option.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.title}</h4>
                      {option.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={option.action}
                  disabled={loading === option.id}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading === option.id ? 'A exportar...' : 'Exportar'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações de Privacidade */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Shield className="h-5 w-5" />
            Privacidade e Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <p>Os dados são exportados diretamente do seu navegador</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <p>Nenhuma informação é enviada para servidores externos</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <p>Os ficheiros exportados ficam apenas no seu dispositivo</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <p>Dados sensíveis como palavras-passe não são incluídos</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1 text-sm">
              ⚠️ Importante
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Guarde os ficheiros exportados num local seguro. Estes contêm informações financeiras sensíveis 
              e devem ser protegidos adequadamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 