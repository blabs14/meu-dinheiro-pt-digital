import { vi } from 'vitest';
import { setMockSupabaseResult, supabaseMock } from '../../../../test-utils/supabaseMockUtil.js';
vi.mock('../../../integrations/supabase/client', () => ({ supabase: supabaseMock }));
const toastMock = vi.fn();
vi.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user1' } }) }));
vi.mock('../../../hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useGoalsData } from '../../../hooks/useGoalsData';

describe('useGoalsData minimalista', () => {
  beforeEach(() => {
    setMockSupabaseResult({
      data: [
        {
          id: 'g1',
          nome: 'Meta Teste',
          user_id: 'user1',
          created_at: '2024-01-01',
          valor: 100,
          progresso: 50,
        },
      ],
      error: null,
    });
  });

  function TestComponent() {
    const { goals, loading } = useGoalsData('user1');
    console.log('[TestComponent] render', { goals, loading });
    return (
      <div>
        <span data-testid="goal-name">{goals?.[0]?.nome || ''}</span>
        <span data-testid="loading">{loading ? 'loading' : 'not-loading'}</span>
      </div>
    );
  }

  it('deve carregar metas corretamente (isolado)', async () => {
    console.log('Antes do render');
    render(<TestComponent />);
    console.log('Depois do render');
    await waitFor(() => {
      const name = screen.getByTestId('goal-name').textContent;
      console.log('Dentro do waitFor, name:', name);
      expect(name).toBe('Meta Teste');
    }, { timeout: 20000 });
  });
}); 