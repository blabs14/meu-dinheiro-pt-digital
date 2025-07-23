import { familySchema } from '../models/familySchema';

export const fetchFamilies = async (supabase: any, userId: string) => {
  return await supabase.from('family_members').select('family_id, role, families(*)').eq('user_id', userId);
};

export const createFamily = async (supabase: any, payload: any) => {
  const parse = familySchema.safeParse(payload);
  if (!parse.success) {
    return { data: null, error: { message: 'Dados inválidos', details: parse.error.errors } };
  }
  return await (supabase.from('families') as any).insert(parse.data).select();
};

export const updateFamily = async (supabase: any, familyId: string, updates: any) => {
  return await supabase.from('families').update(updates).eq('id', familyId).select();
};

export const switchFamilyContext = async (_supabase: any, userId: string, familyId: string) => {
  // Exemplo: lógica para atualizar contexto ativo do utilizador
  // (pode ser implementado via campo em profiles ou sessão)
  return { success: true, userId, familyId };
};

export const removeMember = async (supabase: any, familyId: string, userId: string) => {
  return await supabase.from('family_members').delete().eq('family_id', familyId).eq('user_id', userId);
};

export const transferOwnership = async (supabase: any, familyId: string, newOwnerId: string) => {
  // Atualiza o role do novo owner e do antigo
  await supabase.from('family_members').update({ role: 'owner' }).eq('family_id', familyId).eq('user_id', newOwnerId);
  // Opcional: rebaixar o antigo owner para admin
  // ...
  return { success: true };
};

export const fetchFamilyById = async (supabase: any, id: string) => {
  const { data, error } = await supabase.from('families').select('*').eq('id', id).single();
  return { data, error };
};

export const fetchFamilyMembers = async (supabase: any, familyId: string) => {
  console.log('🔍 familyService - fetchFamilyMembers - Iniciando para familyId:', familyId);
  
  // Tentar função SQL primeiro
  const { data: membersData, error: membersError } = await supabase.rpc('get_family_members_with_profiles', { p_family_id: familyId });
  
  console.log('🔍 familyService - fetchFamilyMembers - Resposta da função SQL:', { membersData, membersError });
  
  if (!membersError && membersData && membersData.success) {
    console.log('🔍 familyService - fetchFamilyMembers - Usando dados da função SQL');
    return { data: membersData.members, error: null };
  }
  
  console.log('🔍 familyService - fetchFamilyMembers - Fallback para query direta');
  
  // Fallback: Query direta
  const { data: directMembers, error: directError } = await supabase.from('family_members').select('*').eq('family_id', familyId);
  
  console.log('🔍 familyService - fetchFamilyMembers - Resposta da query direta:', { directMembers, directError });
  
  if (directError) return { data: null, error: directError };
  return { data: directMembers, error: null };
};

export const updateMemberRole = async (supabase: any, familyId: string, memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
  return await supabase.from('family_members').update({ role: newRole }).eq('id', memberId).eq('family_id', familyId);
};

export function makeFamilyService(supabase: any) {
  return {
    fetchFamilies: (userId: string) => fetchFamilies(supabase, userId),
    createFamily: (payload: any) => createFamily(supabase, payload),
    updateFamily: (familyId: string, updates: any) => updateFamily(supabase, familyId, updates),
    switchFamilyContext: (userId: string, familyId: string) => switchFamilyContext(supabase, userId, familyId),
    removeMember: (familyId: string, userId: string) => removeMember(supabase, familyId, userId),
    transferOwnership: (familyId: string, newOwnerId: string) => transferOwnership(supabase, familyId, newOwnerId),
    fetchFamilyById: (id: string) => fetchFamilyById(supabase, id),
    fetchFamilyMembers: (familyId: string) => fetchFamilyMembers(supabase, familyId),
    updateMemberRole: (familyId: string, memberId: string, newRole: 'admin' | 'member' | 'viewer') => updateMemberRole(supabase, familyId, memberId, newRole),
  };
} 