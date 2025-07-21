import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ChartData {
  month: string;
  receitas: number;
  despesas: number;
  poupanca: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

export interface MonthlyTrendChartProps {
  familyId?: string;
  accountId?: string;
}

export const MonthlyTrendChart = ({ familyId, accountId }: MonthlyTrendChartProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  const loadMonthlyTrend = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obter dados dos últimos 6 meses
      const months: ChartData[] = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = startOfMonth(subMonths(currentDate, i));
        const monthStr = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM yyyy', { locale: pt });
        
        months.push({
          month: monthStr,
          monthLabel,
          receitas: 0,
          despesas: 0,
          poupanca: 0
        });
      }

      // Buscar todas as transações dos últimos 6 meses
      const sixMonthsAgo = format(startOfMonth(subMonths(currentDate, 5)), 'yyyy-MM-dd');
      const nextMonth = format(startOfMonth(subMonths(currentDate, -1)), 'yyyy-MM-dd');

      let query = supabase.from('transactions').select('valor, data, tipo');
      
      // Se familyId for fornecido, filtrar apenas transações dessa família
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else {
        // Se não for fornecido, mostrar apenas transações pessoais (family_id IS NULL)
        query = query.is('family_id', null);
      }
      
      // Filtro de conta
      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }

      query = query.gte('data', sixMonthsAgo).lt('data', nextMonth).order('data');

      const { data: transactions, error } = await query;

      if (error) throw error;

      // Agrupar transações por mês
      transactions?.forEach(transaction => {
        const transactionMonth = transaction.data.slice(0, 7); // YYYY-MM
        const monthData = months.find(m => m.month === transactionMonth);
        
        if (monthData) {
          const valor = Number(transaction.valor);
          if (transaction.tipo === 'receita') {
            monthData.receitas += valor;
          } else {
            monthData.despesas += valor;
          }
        }
      });

      // Calcular saldo para cada mês
      months.forEach(month => {
        month.poupanca = month.receitas - month.despesas;
      });

      setData(months);
    } catch (error) {
      console.error('Erro ao carregar tendência mensal:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId, accountId]);

  useEffect(() => {
    if (user) {
      loadMonthlyTrend();
    }
  }, [user, familyId, accountId, loadMonthlyTrend]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(month => month.receitas > 0 || month.despesas > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Dados insuficientes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione transações para ver a evolução mensal
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução Mensal
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Receitas vs Despesas - Últimos 6 meses
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone"
                dataKey="receitas" 
                name="Receitas" 
                stroke="rgb(34, 197, 94)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone"
                dataKey="despesas" 
                name="Despesas" 
                stroke="rgb(239, 68, 68)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo dos últimos 3 meses */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.slice(-3).map((month, index) => (
            <div key={month.month} className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {month.monthLabel}
              </p>
              <p className={`text-lg font-bold ${
                month.poupanca >= 0 ? 'text-income' : 'text-expense'
              }`}>
                {formatCurrency(month.poupanca)}
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                <div>↗️ {formatCurrency(month.receitas)}</div>
                <div>↘️ {formatCurrency(month.despesas)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 