import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ data: [{ id: '1' }], error: null }))
      }))
    }))
  }
}));
import familyService from './familyService';

describe('familyService', () => {
  beforeEach(() => {
    // mockSelect.mockClear(); // This line is no longer needed as mockSelect is removed
    // mockInsert.mockClear(); // This line is no longer needed as mockInsert is removed
    // mockFrom.mockClear(); // This line is no longer needed as mockFrom is removed
  });

  it('valida corretamente um payload válido', async () => {
    const validPayload = {
      nome: 'Família Teste',
      created_by: '11111111-1111-1111-1111-111111111111',
      description: 'Família para testes',
    };
    const result = await familyService.createFamily(validPayload);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('rejeita payload inválido (nome vazio)', async () => {
    const invalidPayload = {
      nome: '',
      created_by: '11111111-1111-1111-1111-111111111111',
      description: 'Família para testes',
    };
    const result = await familyService.createFamily(invalidPayload);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Dados inválidos');
  });
}); 