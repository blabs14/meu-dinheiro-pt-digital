const mockSignUp = jest.fn(() => ({ data: { user: { id: '1' } }, error: null }));
const mockSignInWithPassword = jest.fn(() => ({ data: { session: { access_token: 'token' } }, error: null }));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    }
  }
}));

import { signup, login } from './authService';

describe('authService', () => {
  beforeEach(() => {
    mockSignUp.mockClear();
    mockSignInWithPassword.mockClear();
  });

  it('signup: aceita payload válido', async () => {
    const payload = { email: 'teste@email.com', password: '123456', nome: 'Utilizador' };
    const result = await signup(payload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
    expect(mockSignUp).toHaveBeenCalledWith({ email: payload.email, password: payload.password });
  });

  it('signup: rejeita payload inválido (email)', async () => {
    const payload = { email: 'invalido', password: '123456', nome: 'Utilizador' };
    const result = await signup(payload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });

  it('login: aceita payload válido', async () => {
    const payload = { email: 'teste@email.com', password: '123456' };
    const result = await login(payload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: payload.email, password: payload.password });
  });

  it('login: rejeita payload inválido (password curta)', async () => {
    const payload = { email: 'teste@email.com', password: '123' };
    const result = await login(payload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });
}); 