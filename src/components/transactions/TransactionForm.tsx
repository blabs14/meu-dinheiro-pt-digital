import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'receita' | 'despesa';
  onSuccess?: () => void;
}

export const TransactionForm = ({ open, onOpenChange, defaultType = 'despesa', onSuccess }: TransactionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    tipo: defaultType,
    valor: '',
    categoria_id: '',
    descricao: '',
    modo: 'pessoal'
  });

  useEffect(() => {
    if (open) {
      loadCategories();
      setFormData(prev => ({ ...prev, tipo: defaultType }));
    }
  }, [open, defaultType]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive"
      });
    }
  };

  const filteredCategories = categories.filter(cat => cat.tipo === formData.tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          tipo: formData.tipo,
          valor: parseFloat(formData.valor),
          data: format(date, 'yyyy-MM-dd'),
          categoria_id: formData.categoria_id || null,
          descricao: formData.descricao || null,
          modo: formData.modo
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${formData.tipo === 'receita' ? 'Receita' : 'Despesa'} adicionada com sucesso`,
      });

      // Reset form
      setFormData({
        tipo: defaultType,
        valor: '',
        categoria_id: '',
        descricao: '',
        modo: 'pessoal'
      });
      setDate(new Date());
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao guardar transação",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.tipo === 'receita' ? (
              <TrendingUp className="h-5 w-5 text-income" />
            ) : (
              <TrendingDown className="h-5 w-5 text-expense" />
            )}
            Nova {formData.tipo === 'receita' ? 'Receita' : 'Despesa'}
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova {formData.tipo} ao seu registo financeiro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: 'receita' | 'despesa') => 
                setFormData({ ...formData, tipo: value, categoria_id: '' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (€)</Label>
            <Input
              id="valor"
              type="text"
              placeholder="0,00"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: formatCurrency(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: pt }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.cor }}
                      />
                      {category.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modo">Modo</Label>
            <Select
              value={formData.modo}
              onValueChange={(value) => setFormData({ ...formData, modo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pessoal">Pessoal</SelectItem>
                <SelectItem value="partilhado">Partilhado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Adicione uma descrição..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.valor}>
              {loading ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 