import { render, screen, act } from '@testing-library/react';
import React, { useState } from 'react';

describe('Hook React mínimo', () => {
  function TestComponent() {
    const [count, setCount] = useState(0);
    return (
      <div>
        <span data-testid="count">{count}</span>
        <button onClick={() => setCount((c) => c + 1)}>Incrementar</button>
      </div>
    );
  }

  it('deve incrementar o contador', async () => {
    await act(async () => {
      render(<TestComponent />);
    });
    expect(screen.getByTestId('count').textContent).toBe('0');
    const btn = screen.getByText('Incrementar');
    await act(async () => {
      btn.click();
    });
    expect(screen.getByTestId('count').textContent).toBe('1');
  });
}); 