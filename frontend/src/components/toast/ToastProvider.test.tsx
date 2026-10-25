import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useToast } from './toast-context';
import { ToastProvider } from './ToastProvider';

function Trigger({ message, tone }: { message: string; tone?: 'success' | 'error' }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast({ message, tone })}>Notify {message}</button>;
}

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces a toast in a polite live region', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger message="You bought 1 × 2023 Toyota Camry XSE" />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: /notify/i }));

    const region = screen.getByRole('region', { name: /notifications/i });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent('You bought 1 × 2023 Toyota Camry XSE');
  });

  it('shows several toasts at once', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger message="First" />
        <Trigger message="Second" tone="error" />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Notify First' }));
    await user.click(screen.getByRole('button', { name: 'Notify Second' }));

    expect(screen.getAllByRole('status').map((toast) => toast.textContent)).toEqual([
      expect.stringContaining('First'),
      expect.stringContaining('Second'),
    ]);
  });

  it('dismisses a toast automatically after 4 seconds', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    act(() => screen.getByRole('button', { name: /notify/i }).click());
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('can be dismissed by hand', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: /notify/i }));
    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('useToast throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });
});
