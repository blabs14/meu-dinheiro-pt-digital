import { render, screen, act, waitFor } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
import { describe, it, expect } from 'vitest';

describe('Hook React minimalista com setTimeout', () => {
  function useAsyncState() {
    const [value, setValue] = useState('inicial');
    useEffect(() => {
      setTimeout(() => {
        setValue('atualizado');
      }, 100);
    }, []);
    return value;
  }

  function TestComponent() {
    const value = useAsyncState();
    console.log('[TestComponent] render', { value });
    return <span data-testid="valor">{value}</span>;
  }

  it('deve atualizar o valor após setTimeout', async () => {
    await act(async () => {
      render(<TestComponent />);
    });
    expect(screen.getByTestId('valor').textContent).toBe('inicial');
    await waitFor(() => expect(screen.getByTestId('valor').textContent).toBe('atualizado'), { timeout: 2000 });
  });
}); 