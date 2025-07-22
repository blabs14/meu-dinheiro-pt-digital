const mockSelect = jest.fn(() => ({ data: [{ id: '1' }], error: null }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

import { createFamily } from './familyService';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom }
}));

describe('familyService', () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockInsert.mockClear();
    mockFrom.mockClear();
  });

  it('valida corretamente um payload válido', async () => {
    const validPayload = {
      nome: 'Família Teste',
      created_by: '11111111-1111-1111-1111-111111111111',
      description: 'Família para testes',
    };
    const result = await createFamily(validPayload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('rejeita payload inválido (nome vazio)', async () => {
    const invalidPayload = {
      nome: '',
      created_by: '11111111-1111-1111-1111-111111111111',
      description: 'Família para testes',
    };
    const result = await createFamily(invalidPayload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });
}); 