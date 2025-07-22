import { vi } from 'vitest';
import { setMockSupabaseResult, supabaseMock } from '../../../../test-utils/supabaseMockUtil.js';
vi.mock('../../../integrations/supabase/client', () => ({ supabase: supabaseMock }));
const toastMock = vi.fn();
vi.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user1' } }) }));
vi.mock('../../../hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useFamilyData } from '../../../hooks/useFamilyData';

describe('useFamilyData minimalista isolado', () => {
  beforeEach(() => {
    setMockSupabaseResult({
      data: {
        id: '1',
        nome: 'Família Teste',
        created_by: 'user1',
        created_at: '2024-01-01',
        settings: {
          allow_view_all: true,
          allow_add_transactions: true,
          require_approval: false,
        },
      },
      error: null,
    });
  });

  function TestComponent() {
    const { currentFamily, loading } = useFamilyData();
    console.log('[TestComponent] render', { currentFamily, loading });
    return (
      <div>
        <span data-testid="family-name">{currentFamily?.nome || ''}</span>
        <span data-testid="loading">{loading ? 'loading' : 'not-loading'}</span>
      </div>
    );
  }

  it('deve carregar dados da família corretamente (isolado)', async () => {
    console.log('Antes do render');
    render(<TestComponent />);
    console.log('Depois do render');
    await waitFor(() => {
      const name = screen.getByTestId('family-name').textContent;
      console.log('Dentro do waitFor, name:', name);
      expect(name).toBe('Família Teste');
    }, { timeout: 20000 });
  });
}); 