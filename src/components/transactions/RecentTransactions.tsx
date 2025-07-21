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

export interface RecentTransactionsProps {
  familyId?: string;
  accountId?: string;
}

export const RecentTransactions = ({ familyId, accountId }: RecentTransactionsProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      console.log('🔍 [RecentTransactions] useEffect triggered - loading transactions');
      loadRecentTransactions();
    } else {
      console.log('⚠️ [RecentTransactions] No user found');
    }
  }, [user, familyId, accountId]);

  const loadRecentTransactions = async () => {
    try {
      setLoading(true);
      console.log('🔍 [RecentTransactions] Iniciando carregamento de transações');
      console.log('🔍 [RecentTransactions] User ID:', user?.id);
      console.log('🔍 [RecentTransactions] Family ID:', familyId);
      console.log('🔍 [RecentTransactions] Account ID:', accountId);

      // Primeiro, verificar se conseguimos aceder à tabela
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      console.log('🔍 [RecentTransactions] Total de transações do utilizador:', count);
      console.log('🔍 [RecentTransactions] Erro ao contar:', countError);

      let query = supabase.from('transactions').select(`
          id,
          valor,
          data,
          tipo,
          descricao,
          modo,
          family_id,
          user_id,
          created_at,
          categories:categoria_id (
            nome,
            cor
          )
        `)
        .eq('user_id', user!.id)
        .order('data', { ascending: false });

      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }

      // Se familyId for fornecido, mostrar apenas transações dessa família
      if (familyId) {
        console.log('🔍 [RecentTransactions] Filtrando por família:', familyId);
        query = query.eq('family_id', familyId);
      } else {
        // Se não for fornecido, mostrar apenas transações pessoais (family_id IS NULL)
        console.log('🔍 [RecentTransactions] Filtrando transações pessoais (family_id IS NULL)');
        query = query.is('family_id', null);
      }

      console.log('🔍 [RecentTransactions] Executando query...');

      const { data, error } = await query.limit(10);

      console.log('🔍 [RecentTransactions] Resultado da query:', data);
      console.log('🔍 [RecentTransactions] Erro da query:', error);
      console.log('🔍 [RecentTransactions] Número de transações retornadas:', data?.length || 0);

      if (error) {
        console.error('❌ [RecentTransactions] Erro detalhado:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ [RecentTransactions] Transações carregadas:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('🔍 [RecentTransactions] Primeira transação:', data[0]);
      }
      
      setTransactions(data || []);
    } catch (error) {
      console.error('❌ [RecentTransactions] Erro ao carregar transações:', error);
      setTransactions([]);
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
          {familyId ? 'Transações da Família' : 'Transações Recentes'}
        </CardTitle>
        <CardDescription>
          {familyId 
            ? 'Movimentações partilhadas com a família'
            : `Últimas ${transactions.length} movimentações`
          }
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