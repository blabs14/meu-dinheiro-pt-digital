import { supabase } from '@/integrations/supabase/client';
import { signupSchema, loginSchema } from '../models/authSchema';

export const signup = async (payload: any) => {
  const parse = signupSchema.safeParse(payload);
  if (!parse.success) {
    return { data: null, error: { message: 'Dados inválidos', details: parse.error.errors } };
  }
  const { email, password } = parse.data;
  const { data, error } = await supabase.auth.signUp({ email, password });
  
  // Se há erro, devolver erro
  if (error) {
    return { data: null, error };
  }
  
  // Se não há user, devolver erro
  if (!data?.user) {
    return { data: null, error: { message: 'Erro ao registar utilizador' } };
  }
  
  // Se há session, devolver dados completos
  if (data.session) {
    return {
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
        expires_in: data.session.expires_in,
      },
      error: null
    };
  }
  
  // Se não há session mas há user, significa que precisa de confirmação de email
  return {
    data: {
      user: data.user,
      message: 'Utilizador registado com sucesso. Verifique o seu email para confirmar a conta.'
    },
    error: null
  };
};

export const login = async (payload: any) => {
  const parse = loginSchema.safeParse(payload);
  if (!parse.success) {
    return { data: null, error: { message: 'Dados inválidos', details: parse.error.errors } };
  }
  const { email, password } = parse.data;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    return { data: null, error: error || { message: 'Credenciais inválidas' } };
  }
  return {
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
      expires_in: data.session.expires_in,
    },
    error: null
  };
};

export const logout = async () => {
  return await supabase.auth.signOut();
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};

export const refreshSession = async (refreshToken: string) => {
  return await supabase.auth.refreshSession({ refresh_token: refreshToken });
}; 

const authService = {
  signup,
  login,
  logout,
  getSession,
  refreshSession,
};
export default authService; 