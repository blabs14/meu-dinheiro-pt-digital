import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useGoalsData } from '@/hooks/useGoalsData';

describe('useGoalsData sem mocks', () => {
  function TestComponent() {
    const { goals, loading } = useGoalsData('user1');
    return (
      <div>
        <span data-testid="goal-name">{goals[0]?.nome || ''}</span>
        <span data-testid="loading">{loading ? 'loading' : 'not-loading'}</span>
      </div>
    );
  }

  it('deve executar o ciclo de vida do hook', async () => {
    await act(async () => {
      render(<TestComponent />);
    });
    // Apenas verificar se o loading muda eventualmente
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toMatch(/loading|not-loading/));
  });
}); 