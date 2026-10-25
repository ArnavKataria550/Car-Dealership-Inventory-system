import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '../../auth/types';
import { server } from '../../test/msw-server';
import { renderWithAuth } from '../../test/render';
import { tokenExpiringIn } from '../../test/tokens';
import { LoginForm } from './LoginForm';

const account: User = {
  id: 'user-1',
  name: 'Arnav Kataria',
  email: 'arnav@example.com',
  role: 'USER',
  createdAt: '2026-10-25T10:00:00.000Z',
};

function mockLogin() {
  const received: unknown[] = [];
  server.use(
    http.post('/api/auth/login', async ({ request }) => {
      const body = (await request.json()) as { password: string };
      received.push(body);
      return body.password === 'supersecret'
        ? HttpResponse.json({ token: tokenExpiringIn(3600), user: account })
        : HttpResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
            { status: 401 },
          );
    }),
  );
  return received;
}

const emailField = () => screen.getByLabelText(/email/i);
const passwordField = () => screen.getByLabelText(/password/i);
const submitButton = () => screen.getByRole('button', { name: /sign in/i });

describe('LoginForm', () => {
  it('renders labelled email and password fields and a sign-in button', () => {
    renderWithAuth(<LoginForm onSuccess={vi.fn()} />);

    expect(emailField()).toHaveAttribute('type', 'email');
    expect(passwordField()).toHaveAttribute('type', 'password');
    expect(submitButton()).toBeEnabled();
  });

  it('shows what is missing and does not call the API when submitted empty', async () => {
    const received = mockLogin();
    const { user } = renderWithAuth(<LoginForm onSuccess={vi.fn()} />);

    await user.click(submitButton());

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(emailField()).toHaveAccessibleDescription('Email is required');
    expect(received).toEqual([]);
  });

  it('rejects an invalid email address before calling the API', async () => {
    const received = mockLogin();
    const { user } = renderWithAuth(<LoginForm onSuccess={vi.fn()} />);

    await user.type(emailField(), 'not-an-email');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(received).toEqual([]);
  });

  it('signs in with the trimmed email and reports the user', async () => {
    const received = mockLogin();
    const onSuccess = vi.fn();
    const { user } = renderWithAuth(<LoginForm onSuccess={onSuccess} />);

    await user.type(emailField(), '  arnav@example.com ');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(account));
    expect(received).toEqual([{ email: 'arnav@example.com', password: 'supersecret' }]);
  });

  it("shows the server's error, keeps the email and clears the password", async () => {
    mockLogin();
    const onSuccess = vi.fn();
    const { user } = renderWithAuth(<LoginForm onSuccess={onSuccess} />);

    await user.type(emailField(), 'arnav@example.com');
    await user.type(passwordField(), 'wrong-password');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(emailField()).toHaveValue('arnav@example.com');
    expect(passwordField()).toHaveValue('');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('disables the button and shows progress while signing in', async () => {
    let release!: () => void;
    server.use(
      http.post('/api/auth/login', async () => {
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json({ token: tokenExpiringIn(3600), user: account });
      }),
    );
    const { user } = renderWithAuth(<LoginForm onSuccess={vi.fn()} />);

    await user.type(emailField(), 'arnav@example.com');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    const busy = await screen.findByRole('button', { name: /signing in/i });
    expect(busy).toBeDisabled();
    release();
    await waitFor(() => expect(submitButton()).toBeEnabled());
  });
});
