import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Transaction {
  id: string;
  valor: number;
  data: string;
  tipo: string;
  descricao: string | null;
  modo: string;
  categories: {
    nome: string;
    cor: string;
  } | null;
}

interface RecentTransactionsProps {
  refreshTrigger?: number;
}

export const RecentTransactions = ({ refreshTrigger }: RecentTransactionsProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentTransactions();
    }
  }, [user, refreshTrigger]);

  const loadRecentTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          valor,
          data,
          tipo,
          descricao,
          modo,
          categories:categoria_id (
            nome,
            cor
          )
        `)
        .eq('user_id', user!.id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM", { locale: pt });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-muted rounded" />
                    <div className="w-16 h-3 bg-muted rounded" />
                  </div>
                </div>
                <div className="w-20 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Transações Recentes
        </CardTitle>
        <CardDescription>
          Últimas {transactions.length} movimentações
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.tipo === 'receita' ? 'bg-income/10' : 'bg-expense/10'
                    }`}>
                      {transaction.tipo === 'receita' ? (
                        <TrendingUp className="h-4 w-4 text-income" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-expense" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {transaction.categories && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: transaction.categories.cor }}
                          />
                        )}
                        <p className="font-medium text-sm">
                          {transaction.descricao || transaction.categories?.nome || 'Sem categoria'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(transaction.data)}</span>
                        {transaction.modo === 'partilhado' && (
                          <Badge variant="secondary" className="text-xs py-0">Partilhado</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    transaction.tipo === 'receita' ? 'text-income' : 'text-expense'
                  }`}>
                    {transaction.tipo === 'receita' ? '+' : '-'}{formatCurrency(transaction.valor)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione a sua primeira receita ou despesa
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 