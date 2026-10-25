import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '../../auth/types';
import { server } from '../../test/msw-server';
import { renderWithAuth } from '../../test/render';
import { tokenExpiringIn } from '../../test/tokens';
import { RegisterForm } from './RegisterForm';

const account: User = {
  id: 'user-1',
  name: 'Arnav Kataria',
  email: 'arnav@example.com',
  role: 'USER',
  createdAt: '2026-10-25T10:00:00.000Z',
};

/** Fake API where register succeeds unless overridden, and login always succeeds. */
function mockApi(registerResponse?: () => Response) {
  const registered: unknown[] = [];
  server.use(
    http.post('/api/auth/register', async ({ request }) => {
      registered.push(await request.json());
      return registerResponse?.() ?? HttpResponse.json({ user: account }, { status: 201 });
    }),
    http.post('/api/auth/login', () =>
      HttpResponse.json({ token: tokenExpiringIn(3600), user: account }),
    ),
  );
  return registered;
}

const nameField = () => screen.getByLabelText(/full name/i);
const emailField = () => screen.getByLabelText(/email/i);
const passwordField = () => screen.getByLabelText(/password/i);
const submitButton = () => screen.getByRole('button', { name: /create account/i });

describe('RegisterForm', () => {
  it('renders name, email and password fields with a password hint', () => {
    renderWithAuth(<RegisterForm onSuccess={vi.fn()} />);

    expect(nameField()).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(passwordField()).toHaveAttribute('type', 'password');
    expect(passwordField()).toHaveAccessibleDescription('At least 8 characters');
  });

  it('lists every missing field and makes no API call', async () => {
    const registered = mockApi();
    const { user } = renderWithAuth(<RegisterForm onSuccess={vi.fn()} />);

    await user.click(submitButton());

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(registered).toEqual([]);
  });

  it('treats a whitespace-only name as missing', async () => {
    mockApi();
    const { user } = renderWithAuth(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(nameField(), '   ');
    await user.click(submitButton());

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });

  it('requires a password of at least 8 characters', async () => {
    const registered = mockApi();
    const { user } = renderWithAuth(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(nameField(), 'Arnav Kataria');
    await user.type(emailField(), 'arnav@example.com');
    await user.type(passwordField(), 'short12');
    await user.click(submitButton());

    expect(passwordField()).toHaveAccessibleDescription('Password must be at least 8 characters');
    expect(registered).toEqual([]);
  });

  it('creates the account with trimmed values, logs in and reports the user', async () => {
    const registered = mockApi();
    const onSuccess = vi.fn();
    const { user } = renderWithAuth(<RegisterForm onSuccess={onSuccess} />);

    await user.type(nameField(), '  Arnav Kataria ');
    await user.type(emailField(), ' arnav@example.com ');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(account));
    expect(registered).toEqual([
      { name: 'Arnav Kataria', email: 'arnav@example.com', password: 'supersecret' },
    ]);
  });

  it('shows a duplicate-email error on the email field', async () => {
    mockApi(() =>
      HttpResponse.json(
        { error: { code: 'CONFLICT', message: 'An account with this email already exists' } },
        { status: 409 },
      ),
    );
    const onSuccess = vi.fn();
    const { user } = renderWithAuth(<RegisterForm onSuccess={onSuccess} />);

    await user.type(nameField(), 'Arnav Kataria');
    await user.type(emailField(), 'arnav@example.com');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    await waitFor(() =>
      expect(emailField()).toHaveAccessibleDescription('An account with this email already exists'),
    );
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows field errors returned by the server next to their fields', async () => {
    mockApi(() =>
      HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body is invalid',
            details: [{ field: 'name', message: 'Name must be at most 100 characters' }],
          },
        },
        { status: 400 },
      ),
    );
    const { user } = renderWithAuth(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(nameField(), 'Arnav Kataria');
    await user.type(emailField(), 'arnav@example.com');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription('Name must be at most 100 characters'),
    );
  });

  it('shows other failures in an alert', async () => {
    mockApi(() => HttpResponse.error());
    const { user } = renderWithAuth(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(nameField(), 'Arnav Kataria');
    await user.type(emailField(), 'arnav@example.com');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach the server/i);
  });

  it('disables the button while the account is being created', async () => {
    let release!: () => void;
    server.use(
      http.post('/api/auth/register', async () => {
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json({ user: account }, { status: 201 });
      }),
      http.post('/api/auth/login', () =>
        HttpResponse.json({ token: tokenExpiringIn(3600), user: account }),
      ),
    );
    const { user } = renderWithAuth(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(nameField(), 'Arnav Kataria');
    await user.type(emailField(), 'arnav@example.com');
    await user.type(passwordField(), 'supersecret');
    await user.click(submitButton());

    expect(await screen.findByRole('button', { name: /creating account/i })).toBeDisabled();
    release();
    await waitFor(() => expect(submitButton()).toBeEnabled());
  });
});
