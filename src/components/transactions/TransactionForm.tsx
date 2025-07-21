import { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';

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
  const [isFamily, setIsFamily] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyIdLoading, setFamilyIdLoading] = useState(false);
  const [familyIdError, setFamilyIdError] = useState<string | null>(null);

  const form = {
    tipo: defaultType,
    valor: '',
    categoria_id: '',
    descricao: '',
    modo: 'pessoal',
    data: new Date()
  };

  useEffect(() => {
    if (open) {
      loadCategories();
      setFormData({
        tipo: defaultType,
        valor: '',
        categoria_id: '',
        descricao: '',
        modo: 'pessoal',
        data: new Date()
      });
    }
  }, [open, defaultType]);

  useEffect(() => {
    const fetchFamily = async () => {
      setFamilyIdLoading(true);
      setFamilyIdError(null);
      if (user) {
        const { data } = await supabase.rpc('get_user_family_data', { p_user_id: user.id });
        console.log('🔍 [TransactionForm] get_user_family_data:', data);
        if (data && Array.isArray(data) && (data[0] as any)?.family?.id) {
          setFamilyId((data[0] as any).family.id);
        } else {
          setFamilyId(null);
          setFamilyIdError('Não foi possível obter o ID da família.');
        }
      }
      setFamilyIdLoading(false);
    };
    fetchFamily();
  }, [user]);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('nome');
    
    if (data) {
      setCategories(data);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = categories.filter(cat => cat.tipo === form.tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 [TransactionForm] Iniciando criação de transação');
      console.log('🔍 [TransactionForm] Dados do formulário:', formData);
      console.log('🔍 [TransactionForm] User ID:', user.id);
      console.log('🔍 [TransactionForm] Is Family:', isFamily);

      // Buscar family_id se for transação familiar
      let familyId = null;
      if (isFamily) {
        console.log('🔍 [TransactionForm] Buscando family_id para transação familiar');
        const { data: familyData, error: familyError } = await supabase
          .rpc('get_user_family_data', { p_user_id: user.id });
        
        console.log('🔍 [TransactionForm] Resultado da busca de família:', familyData);
        console.log('🔍 [TransactionForm] Erro na busca de família:', familyError);
        
        if (familyData && Array.isArray(familyData) && familyData[0]?.family?.id) {
          familyId = familyData[0].family.id;
          console.log('✅ [TransactionForm] Family ID encontrado:', familyId);
        } else {
          console.log('❌ [TransactionForm] Nenhum family ID encontrado');
        }
      } else {
        console.log('✅ [TransactionForm] Transação pessoal - family_id será null');
      }

      const transactionData = {
        user_id: user.id,
        valor: parseFloat(formData.valor.replace(',', '.')),
        tipo: formData.tipo,
        categoria_id: formData.categoria_id,
        data: date.toISOString().split('T')[0],
        descricao: formData.descricao,
        modo: formData.modo,
        family_id: familyId
      };

      console.log('🔍 [TransactionForm] Dados finais da transação:', transactionData);

      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();

      console.log('🔍 [TransactionForm] Resultado da inserção:', insertData);
      console.log('🔍 [TransactionForm] Erro na inserção:', insertError);

      if (insertError) throw insertError;

      console.log('✅ [TransactionForm] Transação criada com sucesso');

      toast({
        title: "Sucesso!",
        description: `${formData.tipo === 'receita' ? 'Receita' : 'Despesa'} adicionada com sucesso`,
      });

      // Reset form data
      setFormData({
        tipo: defaultType,
        valor: '',
        categoria_id: '',
        descricao: '',
        modo: 'pessoal'
      });
      setDate(new Date());
      setIsFamily(false);
      
      onSuccess?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error('❌ [TransactionForm] Erro ao adicionar transação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar transação';
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

  const [formData, setFormData] = useState({
    tipo: defaultType,
    valor: '',
    categoria_id: '',
    descricao: '',
    modo: 'pessoal',
    data: new Date()
  });

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
                setFormData(prev => ({ ...prev, tipo: value }))
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
              onChange={(e) => setFormData(prev => ({ ...prev, valor: formatCurrency(e.target.value) }))}
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, modo: value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Switch id="is-family" checked={isFamily} onCheckedChange={setIsFamily} />
            <label htmlFor="is-family" className="text-sm">Esta transação é da família?</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.valor || (isFamily && (!familyId || familyIdLoading))}
            >
              {loading ? 'A guardar...' : 'Guardar'}
            </Button>
            {isFamily && familyIdError && (
              <div className="text-red-600 text-xs mt-2">{familyIdError}</div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 