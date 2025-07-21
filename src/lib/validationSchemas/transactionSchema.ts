import { z } from 'zod';

export const formSchema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  valor: z.string().min(1, 'Valor é obrigatório'),
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  data: z.date(),
  descricao: z.string().optional(),
  modo: z.enum(['pessoal', 'partilhado']).default('pessoal')
});

export type TransactionFormData = z.infer<typeof formSchema>; 