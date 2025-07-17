import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ExpenseCategory {
  nome: string;
  valor: number;
  cor: string;
  percentage: number;
}

interface ExpensesPieChartProps {
  refreshTrigger?: number;
}

export const ExpensesPieChart = ({ refreshTrigger }: ExpensesPieChartProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user) {
      loadExpensesByCategory();
    }
  }, [user, refreshTrigger]);

  const loadExpensesByCategory = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          valor,
          categories:categoria_id (
            nome,
            cor
          )
        `)
        .eq('user_id', user!.id)
        .eq('tipo', 'despesa')
        .gte('data', `${currentMonth}-01`)
        .lt('data', `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 10)}`);

      if (error) throw error;

      // Agrupar por categoria
      const categoryMap = new Map<string, { nome: string; valor: number; cor: string }>();
      let totalExpenses = 0;

      transactions?.forEach(transaction => {
        const categoryName = transaction.categories?.nome || 'Sem categoria';
        const categoryColor = transaction.categories?.cor || '#6B7280';
        const valor = Number(transaction.valor);
        
        totalExpenses += valor;
        
        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName)!;
          existing.valor += valor;
        } else {
          categoryMap.set(categoryName, {
            nome: categoryName,
            valor,
            cor: categoryColor
          });
        }
      });

      // Converter para array e calcular percentagens
      const categoryData: ExpenseCategory[] = Array.from(categoryMap.values())
        .map(category => ({
          ...category,
          percentage: totalExpenses > 0 ? (category.valor / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 6); // Top 6 categorias

      setData(categoryData);
      setTotal(totalExpenses);
    } catch (error) {
      console.error('Erro ao carregar despesas por categoria:', error);
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.nome}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.valor)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload?.map((entry: any, index: number) => (
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
                dataKey="valor"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
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
                  style={{ backgroundColor: category.cor }}
                />
                <span>{category.nome}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(category.valor)}</span>
                <span className="text-muted-foreground ml-1">
                  ({category.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 