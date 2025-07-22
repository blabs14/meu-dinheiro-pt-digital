const mockSelect = jest.fn(() => ({ data: [{ id: '1' }], error: null }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

import { createGoal } from './goalService';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom }
}));

describe('goalService', () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockInsert.mockClear();
    mockFrom.mockClear();
  });

  it('valida corretamente um payload válido', async () => {
    const validPayload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      nome: 'Poupar para férias',
      valor_objetivo: 1000,
      valor_atual: 0,
      data_limite: '2024-12-31',
      descricao: 'Meta para férias de verão',
      account_id: '33333333-3333-3333-3333-333333333333',
      family_id: null
    };
    const result = await createGoal(validPayload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('rejeita payload inválido (valor_objetivo negativo)', async () => {
    const invalidPayload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      nome: 'Poupar para férias',
      valor_objetivo: -1000,
      valor_atual: 0,
      data_limite: '2024-12-31',
      descricao: 'Meta para férias de verão',
      account_id: '33333333-3333-3333-3333-333333333333',
      family_id: null
    };
    const result = await createGoal(invalidPayload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });
}); 