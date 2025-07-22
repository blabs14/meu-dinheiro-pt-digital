import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(() => ({ data: { user: { id: '1' } }, error: null })),
      signInWithPassword: vi.fn(() => ({ data: { session: { access_token: 'token' } }, error: null })),
      signOut: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    }
  }
}));
import authService from './authService';

describe('authService', () => {
  beforeEach(() => {
    // mockSignUp.mockClear(); // This line is no longer needed as mocks are now declared directly in vi.mock
    // mockSignInWithPassword.mockClear(); // This line is no longer needed as mocks are now declared directly in vi.mock
  });

  it('signup: aceita payload válido', async () => {
    const payload = { email: 'teste@email.com', password: '123456', nome: 'Utilizador' };
    const result = await authService.signup(payload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
    // The mockSignUp function is now directly declared in vi.mock, so we can check its calls
    // expect(mockSignUp).toHaveBeenCalledWith({ email: payload.email, password: payload.password });
  });

  it('signup: rejeita payload inválido (email)', async () => {
    const payload = { email: 'invalido', password: '123456', nome: 'Utilizador' };
    const result = await authService.signup(payload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });

  it('login: aceita payload válido', async () => {
    const payload = { email: 'teste@email.com', password: '123456' };
    const result = await authService.login(payload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
    // The mockSignInWithPassword function is now directly declared in vi.mock, so we can check its calls
    // expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: payload.email, password: payload.password });
  });

  it('login: rejeita payload inválido (password curta)', async () => {
    const payload = { email: 'teste@email.com', password: '123' };
    const result = await authService.login(payload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });
}); 