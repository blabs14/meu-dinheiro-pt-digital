import { z } from 'zod';

export const transactionSchema = z.object({
  user_id: z.string().uuid(),
  valor: z.number().positive(),
  tipo: z.enum(['receita', 'despesa']),
  categoria_id: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descricao: z.string().optional(),
  account_id: z.string().uuid(),
  family_id: z.string().uuid().nullable().optional()
});

export type TransactionFormData = z.infer<typeof transactionSchema>; 