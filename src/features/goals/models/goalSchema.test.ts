import { describe, it, expect } from 'vitest';
import { goalSchema } from './goalSchema';

describe('goalSchema', () => {
  it('valida um payload válido', () => {
    const result = goalSchema.safeParse({
      name: 'Meta Teste',
      targetAmount: 100,
      deadline: new Date(Date.now() + 86400000), // Amanhã
      userId: '11111111-1111-1111-1111-111111111111',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const result = goalSchema.safeParse({
      name: '',
      targetAmount: 100,
      deadline: new Date(Date.now() + 86400000),
      userId: '11111111-1111-1111-1111-111111111111',
    });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toContain('name');
  });

  it('rejeita targetAmount <= 0', () => {
    const result = goalSchema.safeParse({
      name: 'Meta',
      targetAmount: 0,
      deadline: new Date(Date.now() + 86400000),
      userId: '11111111-1111-1111-1111-111111111111',
    });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toContain('targetAmount');
  });

  it('rejeita deadline passada', () => {
    const result = goalSchema.safeParse({
      name: 'Meta',
      targetAmount: 100,
      deadline: new Date(Date.now() - 86400000), // Ontem
      userId: '11111111-1111-1111-1111-111111111111',
    });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toContain('deadline');
  });

  it('rejeita userId inválido', () => {
    const result = goalSchema.safeParse({
      name: 'Meta',
      targetAmount: 100,
      deadline: new Date(Date.now() + 86400000),
      userId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toContain('userId');
  });
}); 