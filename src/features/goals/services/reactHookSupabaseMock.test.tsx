import { render, screen, act, waitFor } from '@testing-library/react';
import React, { useEffect, useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [{ id: '1', nome: 'Meta Teste' }],
          error: null
        })
      })
    })
  }
}));

describe('Hook React + Supabase mock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TestComponent() {
    const [meta, setMeta] = useState('');
    useEffect(() => {
      async function fetchMeta() {
        const { supabase } = await import('../../../integrations/supabase/client');
        const query = supabase.from('goals').select();
        const { data } = await query.order('created_at', { ascending: false });
        setMeta(data[0]?.nome || '');
      }
      fetchMeta();
    }, []);
    return <span data-testid="meta-nome">{meta}</span>;
  }

  it('deve mostrar o nome da meta mockada', async () => {
    await act(async () => {
      render(<TestComponent />);
    });
    await waitFor(() => expect(screen.getByTestId('meta-nome').textContent).toBe('Meta Teste'));
  });
}); 