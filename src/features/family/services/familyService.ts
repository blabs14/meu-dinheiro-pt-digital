import { supabase } from '@/integrations/supabase/client';
import { familySchema } from '../models/familySchema';

export const fetchFamilies = async (userId: string) => {
  return await supabase.from('family_members').select('family_id, role, families(*)').eq('user_id', userId);
};

export const createFamily = async (payload: any) => {
  const parse = familySchema.safeParse(payload);
  if (!parse.success) {
    return { data: null, error: { message: 'Dados inválidos', details: parse.error.errors } };
  }
  return await (supabase.from('families') as any).insert(parse.data).select();
};

export const updateFamily = async (familyId: string, updates: any) => {
  return await supabase.from('families').update(updates).eq('id', familyId).select();
};

export const switchFamilyContext = async (userId: string, familyId: string) => {
  // Exemplo: lógica para atualizar contexto ativo do utilizador
  // (pode ser implementado via campo em profiles ou sessão)
  return { success: true, userId, familyId };
};

export const removeMember = async (familyId: string, userId: string) => {
  return await supabase.from('family_members').delete().eq('family_id', familyId).eq('user_id', userId);
};

export const transferOwnership = async (familyId: string, newOwnerId: string) => {
  // Atualiza o role do novo owner e do antigo
  await supabase.from('family_members').update({ role: 'owner' }).eq('family_id', familyId).eq('user_id', newOwnerId);
  // Opcional: rebaixar o antigo owner para admin
  // ...
  return { success: true };
}; 