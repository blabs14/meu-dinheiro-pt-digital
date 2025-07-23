import { z } from 'zod';

export const goalSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  targetAmount: z.number().positive('O valor da meta deve ser maior que zero'),
  deadline: z.coerce.date().refine((date) => date > new Date(), {
    message: 'A data limite deve ser futura',
  }),
  userId: z.string().uuid('userId inválido'),
});

export type GoalInput = z.infer<typeof goalSchema>; 