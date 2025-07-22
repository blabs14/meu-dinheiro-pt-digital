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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
  const [transactionType, setTransactionType] = useState<'pessoal' | 'familiar'>('pessoal');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');

  const form = {
    tipo: defaultType,
    valor: '',
    categoria_id: '',
    descricao: '',
    data: new Date()
  };

  useEffect(() => {
    if (open) {
      loadCategories();
      loadAccounts();
      loadFamilies();
      setFormData({
        tipo: defaultType,
        valor: '',
        categoria_id: '',
        descricao: '',
        data: new Date()
      });
      setTransactionType('pessoal');
      setSelectedAccountId('');
      setSelectedFamilyId('');
    }
  }, [open, defaultType]);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('nome');
    
    if (data) {
      setCategories(data);
    }
  }, []);

  const loadAccounts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setAccounts(data || []);
  };

  const loadFamilies = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('family_members')
      .select('family_id, families (id, nome)')
      .eq('user_id', user.id);
    if (data) {
      setFamilies(data.map(fm => fm.families));
    }
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = categories.filter(cat => cat.tipo === form.tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccountId || (transactionType === 'familiar' && !selectedFamilyId)) return;

    setLoading(true);
    try {
      console.log('🔍 [TransactionForm] Iniciando criação de transação');
      console.log('🔍 [TransactionForm] Dados do formulário:', formData);
      console.log('🔍 [TransactionForm] User ID:', user.id);

      const transactionData = {
        user_id: user.id,
        valor: parseFloat(formData.valor.replace(',', '.')),
        tipo: formData.tipo,
        categoria_id: formData.categoria_id,
        data: date.toISOString().split('T')[0],
        descricao: formData.descricao,
        account_id: selectedAccountId,
        family_id: transactionType === 'familiar' ? selectedFamilyId : null
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
        data: new Date()
      });
      setDate(new Date());
      
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
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Adicione uma descrição..."
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="mb-4">
            <Label>Tipo de transação</Label>
            <ToggleGroup type="single" value={transactionType} onValueChange={v => v && setTransactionType(v as 'pessoal' | 'familiar')}>
              <ToggleGroupItem value="pessoal">Pessoal</ToggleGroupItem>
              <ToggleGroupItem value="familiar">Familiar</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {transactionType === 'familiar' && (
            <div className="space-y-2">
              <Label htmlFor="family">Família</Label>
              <select
                id="family"
                required
                value={selectedFamilyId}
                onChange={e => setSelectedFamilyId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Selecionar família</option>
                {families.map(fam => (
                  <option key={fam.id} value={fam.id}>{fam.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="account">Conta Bancária</Label>
            <select
              id="account"
              required
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Selecionar conta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.nome}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.valor || (transactionType === 'familiar' && !selectedFamilyId) || !selectedAccountId}
            >
              {loading ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 