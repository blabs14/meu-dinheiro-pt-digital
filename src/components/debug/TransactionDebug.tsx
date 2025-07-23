import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const TransactionDebug = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAllTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          valor,
          tipo,
          data,
          descricao,
          family_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllTransactions();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const personalTransactions = transactions.filter(t => t.family_id === null);
  const familyTransactions = transactions.filter(t => t.family_id !== null);

  return (
    <Card className="border-red-400">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          🔍 Debug - Transações
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadAllTransactions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Resumo:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total de Transações:</strong> {transactions.length}
              </div>
              <div>
                <strong>Pessoais (family_id = null):</strong> {personalTransactions.length}
              </div>
              <div>
                <strong>Familiares (family_id ≠ null):</strong> {familyTransactions.length}
              </div>
              <div>
                <strong>User ID:</strong> {user?.id}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Transações Pessoais:</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {personalTransactions.map((t) => (
                <div key={t.id} className="text-xs p-2 border rounded bg-green-50">
                  <div><strong>ID:</strong> {t.id}</div>
                  <div><strong>Tipo:</strong> {t.tipo}</div>
                  <div><strong>Valor:</strong> {formatCurrency(t.valor)}</div>
                  <div><strong>Data:</strong> {formatDate(t.data)}</div>
                  <div><strong>Family ID:</strong> {t.family_id || 'NULL'}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Transações Familiares:</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {familyTransactions.map((t) => (
                <div key={t.id} className="text-xs p-2 border rounded bg-blue-50">
                  <div><strong>ID:</strong> {t.id}</div>
                  <div><strong>Tipo:</strong> {t.tipo}</div>
                  <div><strong>Valor:</strong> {formatCurrency(t.valor)}</div>
                  <div><strong>Data:</strong> {formatDate(t.data)}</div>
                  <div><strong>Family ID:</strong> {t.family_id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 