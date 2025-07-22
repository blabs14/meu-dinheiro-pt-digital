import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Target, Edit, Trash2, Calendar, Euro, TrendingUp } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Goal {
  id: string;
  nome: string;
  valor_objetivo: number;
  valor_atual: number;
  prazo: string | null;
  created_at: string;
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onUpdateAmount: (goalId: string, newAmount: number) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete, onUpdateAmount }: GoalCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const progressPercentage = goal.valor_objetivo > 0 ? Math.min((goal.valor_atual / goal.valor_objetivo) * 100, 100) : 0;
  const remainingAmount = Math.max(goal.valor_objetivo - goal.valor_atual, 0);
  const isCompleted = goal.valor_atual >= goal.valor_objetivo;

  // Cálculos de prazo
  const hasDeadline = !!goal.prazo;
  const deadline = hasDeadline ? new Date(goal.prazo!) : null;
  const daysRemaining = deadline ? differenceInDays(deadline, new Date()) : null;
  const isOverdue = deadline ? isPast(deadline) && !isCompleted : false;

  const getStatusBadge = () => {
    if (isCompleted) return { text: 'Concluída', variant: 'default' as const, color: 'text-income' };
    if (isOverdue) return { text: 'Em Atraso', variant: 'destructive' as const, color: 'text-expense' };
    if (daysRemaining !== null && daysRemaining <= 30) return { text: 'Urgente', variant: 'secondary' as const, color: 'text-warning' };
    return { text: 'Em Progresso', variant: 'outline' as const, color: 'text-muted-foreground' };
  };

  const status = getStatusBadge();

  const handleQuickAdd = async (amount: number) => {
    setIsUpdating(true);
    try {
      const newAmount = Math.min(goal.valor_atual + amount, goal.valor_objetivo);
      await onUpdateAmount(goal.id, newAmount);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">{goal.nome}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={status.variant}>{status.text}</Badge>
                {hasDeadline && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {deadline && format(deadline, "dd MMM yyyy", { locale: pt })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(goal)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar Meta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem a certeza que deseja eliminar a meta "{goal.nome}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(goal.id)}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progresso Visual */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className={`font-medium ${status.color}`}>
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3"
          />
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Atual</p>
            <p className="text-lg font-bold text-income">
              {formatCurrency(goal.valor_atual)}
            </p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Meta</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(goal.valor_objetivo)}
            </p>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="text-center p-3 bg-muted rounded-lg">
          {isCompleted ? (
            <div className="text-income">
              <TrendingUp className="h-5 w-5 mx-auto mb-1" />
              <p className="text-sm font-medium">Meta Atingida! 🎉</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Faltam</p>
              <p className="text-lg font-bold">{formatCurrency(remainingAmount)}</p>
              {daysRemaining !== null && daysRemaining > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {daysRemaining} dias restantes
                </p>
              )}
            </div>
          )}
        </div>

        {/* Botões de Ação Rápida */}
        {!isCompleted && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleQuickAdd(50)}
              disabled={isUpdating}
            >
              <Euro className="h-4 w-4 mr-1" />
              +50€
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleQuickAdd(100)}
              disabled={isUpdating}
            >
              <Euro className="h-4 w-4 mr-1" />
              +100€
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleQuickAdd(200)}
              disabled={isUpdating}
            >
              <Euro className="h-4 w-4 mr-1" />
              +200€
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 