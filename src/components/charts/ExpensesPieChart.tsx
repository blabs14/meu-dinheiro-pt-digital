import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ExpenseData {
  categoria: string;
  total: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartData;
  }>;
}

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

export interface ExpensesPieChartProps {
  familyId?: string | null;
  selectedMonth?: string;
}

export const ExpensesPieChart = ({ familyId, selectedMonth = 'current' }: ExpensesPieChartProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user) {
      loadExpensesData();
    }
  }, [user, familyId, selectedMonth]);

  const loadExpensesData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select(`
          valor,
          tipo,
          data,
          categories:categoria_id (
            nome,
            cor
          )
        `)
        .eq('tipo', 'despesa');

      // Filtrar por família ou pessoal
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else {
        query = query.is('family_id', null);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      // Filtrar por mês se necessário
      let filteredTransactions = transactions || [];
      
      if (selectedMonth === 'current') {
        const now = new Date();
        filteredTransactions = transactions?.filter(t => {
          const transactionDate = new Date(t.data);
          return transactionDate.getMonth() === now.getMonth() &&
                 transactionDate.getFullYear() === now.getFullYear();
        }) || [];
      } else if (selectedMonth !== 'all' && selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        filteredTransactions = transactions?.filter(t => {
          const transactionDate = new Date(t.data);
          return transactionDate.getMonth() === (month - 1) &&
                 transactionDate.getFullYear() === year;
        }) || [];
      }

      // Agrupar por categoria
      const groupedData = filteredTransactions.reduce((acc: any, transaction) => {
        const categoryName = transaction.categories?.nome || 'Sem categoria';
        const categoryColor = transaction.categories?.cor || '#6B7280';
        
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            fill: categoryColor
          };
        }
        
        acc[categoryName].value += transaction.valor;
        return acc;
      }, {});

      const chartData: ChartData[] = Object.values(groupedData).map((item: any) => ({
        name: item.name,
        value: item.value,
        color: item.fill
      }));
      
      const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);
      
      setData(chartData);
      setTotal(totalExpenses);
    } catch (error) {
      console.error('Erro ao carregar dados de despesas:', error);
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

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({(data.value / total * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: CustomLegendProps) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <PieChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione algumas despesas para ver o gráfico
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
          <PieChartIcon className="h-5 w-5" />
          Despesas por Categoria
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {formatCurrency(total)} este mês
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Lista detalhada */}
        <div className="mt-4 space-y-2">
          {data.map((category, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(category.value)}</span>
                <span className="text-muted-foreground ml-1">
                  ({(category.value / total * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 