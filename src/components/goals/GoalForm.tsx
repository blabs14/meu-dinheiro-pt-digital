import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Target, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface Goal {
  id?: string;
  nome: string;
  valor_meta: number;
  valor_atual: number;
  prazo: string | null;
}

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSuccess?: () => void;
}

export const GoalForm = ({ open, onOpenChange, goal, onSuccess }: GoalFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [isFamily, setIsFamily] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    valor_meta: '',
    valor_atual: '',
    descricao: ''
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        // Editar meta existente
        setFormData({
          nome: goal.nome,
          valor_meta: goal.valor_meta?.toString() || '0',
          valor_atual: goal.valor_atual?.toString() || '0',
          descricao: ''
        });
        if (goal.prazo) {
          setDeadline(new Date(goal.prazo));
        }
      } else {
        // Nova meta
        setFormData({
          nome: '',
          valor_meta: '',
          valor_atual: '0',
          descricao: ''
        });
        setDeadline(undefined);
      }
    }
  }, [open, goal]);

  useEffect(() => {
    // Buscar family_id do utilizador autenticado
    const fetchFamily = async () => {
      if (user) {
        const { data } = await supabase.rpc('get_user_family_data', { p_user_id: user.id });
        if (data && Array.isArray(data) && (data[0] as { family?: { id: string } })?.family?.id) {
          setFamilyId((data[0] as { family: { id: string } }).family.id);
        }
      }
    };
    fetchFamily();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const goalData = {
        user_id: user.id,
        nome: formData.nome,
        valor_objetivo: parseFloat(formData.valor_meta), // Corrigido: usar valor_objetivo
        valor_atual: parseFloat(formData.valor_atual),
        prazo: deadline ? format(deadline, 'yyyy-MM-dd') : null,
        family_id: isFamily && familyId ? familyId : null
      };

      console.log('🔍 [GoalForm] Criando meta com dados:', goalData);

      if (goal?.id) {
        // Atualizar meta existente
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', goal.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Meta atualizada com sucesso",
        });
      } else {
        // Criar nova meta
        const { error } = await supabase
          .from('goals')
          .insert(goalData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: isFamily ? "Meta familiar criada com sucesso" : "Meta pessoal criada com sucesso",
        });
      }

      // Reset form
      setFormData({
        nome: '',
        valor_meta: '',
        valor_atual: '0',
        descricao: ''
      });
      setDeadline(undefined);
      setIsFamily(false);
      onOpenChange(false);
      onSuccess?.();

    } catch (error: unknown) {
      console.error('❌ [GoalForm] Erro ao guardar meta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao guardar meta';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return numericValue;
  };

  const isEditing = !!goal?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Target className="h-5 w-5 text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
            {isEditing ? 'Editar Meta' : 'Nova Meta'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os detalhes da sua meta de poupança.'
              : 'Defina uma nova meta de poupança para atingir.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Meta *</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Fundo de Emergência, Férias, Casa Nova..."
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_meta">Valor da Meta (€) *</Label>
            <Input
              id="valor_meta"
              type="text"
              placeholder="0,00"
              value={formData.valor_meta}
              onChange={(e) => setFormData({ ...formData, valor_meta: formatCurrency(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_atual">Valor Atual (€)</Label>
            <Input
              id="valor_atual"
              type="text"
              placeholder="0,00"
              value={formData.valor_atual}
              onChange={(e) => setFormData({ ...formData, valor_atual: formatCurrency(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Quanto já poupou para esta meta
            </p>
          </div>

          <div className="space-y-2">
            <Label>Prazo (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "dd 'de' MMMM 'de' yyyy", { locale: pt }) : "Selecionar prazo"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Switch id="is-family" checked={isFamily} onCheckedChange={setIsFamily} />
            <label htmlFor="is-family" className="text-sm">Esta meta é da família?</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.nome || !formData.valor_meta}>
              {loading ? 'A guardar...' : (isEditing ? 'Atualizar' : 'Criar Meta')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 