import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Trophy
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'achievement';
  title: string;
  message: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
  read: boolean;
}

interface NotificationSystemProps {
  refreshTrigger?: number;
}

export const NotificationSystem = ({ refreshTrigger }: NotificationSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      checkForNotifications();
    }
  }, [user, refreshTrigger]);

  const checkForNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const newNotifications: Notification[] = [];
      const currentDate = new Date();
      const currentMonth = startOfMonth(currentDate);
      const endCurrentMonth = endOfMonth(currentDate);

      // 1. Verificar metas próximas do prazo
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .not('prazo', 'is', null);

      goals?.forEach(goal => {
        if (goal.prazo) {
          const deadline = new Date(goal.prazo);
          const daysLeft = differenceInDays(deadline, currentDate);
          const progress = goal.valor_meta > 0 ? (goal.valor_atual / goal.valor_meta) * 100 : 0;

          // Meta próxima do prazo mas longe de ser atingida
          if (daysLeft <= 30 && daysLeft > 0 && progress < 50) {
            newNotifications.push({
              id: `goal-deadline-${goal.id}`,
              type: 'warning',
              title: 'Meta Próxima do Prazo',
              message: `"${goal.nome}" vence em ${daysLeft} dias e está apenas ${progress.toFixed(0)}% completa`,
              icon: <Target className="h-4 w-4" />,
              createdAt: currentDate,
              read: false
            });
          }

          // Meta atingida
          if (progress >= 100) {
            newNotifications.push({
              id: `goal-achieved-${goal.id}`,
              type: 'achievement',
              title: 'Meta Atingida! 🎉',
              message: `Parabéns! Conseguiu atingir "${goal.nome}"`,
              icon: <Trophy className="h-4 w-4" />,
              createdAt: currentDate,
              read: false
            });
          }
        }
      });

      // 2. Verificar despesas fixas próximas
      const { data: fixedExpenses } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativa', true);

      const today = currentDate.getDate();
      fixedExpenses?.forEach(expense => {
        const daysUntilDue = expense.dia_vencimento - today;
        
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          newNotifications.push({
            id: `bill-due-${expense.id}`,
            type: 'info',
            title: 'Fatura a Vencer',
            message: `"${expense.nome}" vence ${daysUntilDue === 0 ? 'hoje' : `em ${daysUntilDue} dias`}`,
            icon: <Calendar className="h-4 w-4" />,
            createdAt: currentDate,
            read: false
          });
        }
      });

      // 3. Verificar gastos excessivos este mês
      const { data: transactions } = await supabase
        .from('transactions')
        .select('valor, tipo')
        .eq('user_id', user.id)
        .gte('data', format(currentMonth, 'yyyy-MM-dd'))
        .lte('data', format(endCurrentMonth, 'yyyy-MM-dd'));

      if (transactions && transactions.length > 0) {
        const income = transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0);
        const expenses = transactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Number(t.valor), 0);
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Taxa de poupança muito baixa
        if (income > 0 && savingsRate < 5) {
          newNotifications.push({
            id: 'low-savings-rate',
            type: 'warning',
            title: 'Taxa de Poupança Baixa',
            message: `Este mês está apenas a poupar ${savingsRate.toFixed(1)}%. Considere reduzir algumas despesas.`,
            icon: <TrendingDown className="h-4 w-4" />,
            createdAt: currentDate,
            read: false
          });
        }

        // Excelente taxa de poupança
        if (savingsRate >= 30) {
          newNotifications.push({
            id: 'excellent-savings',
            type: 'achievement',
            title: 'Poupança Excelente! 💪',
            message: `Fantástico! Está a poupar ${savingsRate.toFixed(1)}% este mês`,
            icon: <TrendingUp className="h-4 w-4" />,
            createdAt: currentDate,
            read: false
          });
        }
      }

      // 4. Verificar se não há transações há muito tempo
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentTransactions && recentTransactions.length > 0) {
        const lastTransaction = new Date(recentTransactions[0].created_at);
        const daysSinceLastTransaction = differenceInDays(currentDate, lastTransaction);

        if (daysSinceLastTransaction >= 7) {
          newNotifications.push({
            id: 'no-recent-transactions',
            type: 'info',
            title: 'Adicione Transações',
            message: `Não regista transações há ${daysSinceLastTransaction} dias. Mantenha o seu controlo financeiro atualizado!`,
            icon: <Info className="h-4 w-4" />,
            createdAt: currentDate,
            read: false
          });
        }
      }

      // Filtrar notificações já vistas (localStorage)
      const seenNotifications = JSON.parse(localStorage.getItem(`seen_notifications_${user.id}`) || '[]');
      const filteredNotifications = newNotifications.filter(
        notification => !seenNotifications.includes(notification.id)
      );

      setNotifications(filteredNotifications);

    } catch (error) {
      console.error('Erro ao verificar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Guardar como vista no localStorage
    const seenNotifications = JSON.parse(localStorage.getItem(`seen_notifications_${user!.id}`) || '[]');
    seenNotifications.push(notificationId);
    localStorage.setItem(`seen_notifications_${user!.id}`, JSON.stringify(seenNotifications));
  };

  const markAllAsRead = () => {
    const seenNotifications = JSON.parse(localStorage.getItem(`seen_notifications_${user!.id}`) || '[]');
    notifications.forEach(notification => {
      seenNotifications.push(notification.id);
    });
    localStorage.setItem(`seen_notifications_${user!.id}`, JSON.stringify(seenNotifications));
    setNotifications([]);
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'achievement': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'info': default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação nova</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="p-3 hover:bg-muted/50 transition-colors relative group"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(notification.createdAt, "HH:mm", { locale: pt })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {notification.action && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={notification.action.onClick}>
                        {notification.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              As notificações ajudam-no a manter-se no caminho certo
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}; 