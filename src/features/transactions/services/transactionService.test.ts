const mockSelect = jest.fn(() => ({ data: [{ id: '1' }], error: null }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom }
}));

import { createTransaction } from './transactionService';

describe('transactionService', () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockInsert.mockClear();
    mockFrom.mockClear();
  });

  it('valida corretamente um payload válido', async () => {
    const validPayload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      valor: 100,
      tipo: 'receita',
      categoria_id: '22222222-2222-2222-2222-222222222222',
      data: '2024-07-01',
      descricao: 'Teste',
      account_id: '33333333-3333-3333-3333-333333333333',
      family_id: null
    };
    const result = await createTransaction(validPayload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('rejeita payload inválido (valor negativo)', async () => {
    const invalidPayload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      valor: -50,
      tipo: 'receita',
      categoria_id: '22222222-2222-2222-2222-222222222222',
      data: '2024-07-01',
      descricao: 'Teste',
      account_id: '33333333-3333-3333-3333-333333333333',
      family_id: null
    };
    const result = await createTransaction(invalidPayload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });

  it('rejeita payload inválido (uuid mal formado)', async () => {
    const invalidPayload = {
      user_id: 'not-a-uuid',
      valor: 100,
      tipo: 'receita',
      categoria_id: '22222222-2222-2222-2222-222222222222',
      data: '2024-07-01',
      descricao: 'Teste',
      account_id: '33333333-3333-3333-3333-333333333333',
      family_id: null
    };
    const result = await createTransaction(invalidPayload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });
}); 