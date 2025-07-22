import { z } from 'zod';

export const familySchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  created_by: z.string().uuid(),
  description: z.string().optional(),
});

export type FamilyFormData = z.infer<typeof familySchema>; 