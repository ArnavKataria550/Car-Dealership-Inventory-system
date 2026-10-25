import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { saveSession } from './auth/session';
import type { Role, User } from './auth/types';
import { appRoutes } from './routes/app-routes';
import { server } from './test/msw-server';
import { tokenExpiringIn } from './test/tokens';

const accounts: Record<string, User> = {
  'arnav@example.com': {
    id: 'user-1',
    name: 'Arnav Kataria',
    email: 'arnav@example.com',
    role: 'USER',
    createdAt: '2026-10-25T10:00:00.000Z',
  },
  'admin@dealership.local': {
    id: 'admin-1',
    name: 'Dealership Admin',
    email: 'admin@dealership.local',
    role: 'ADMIN',
    createdAt: '2026-10-25T10:00:00.000Z',
  },
};

function mockAuthApi() {
  server.use(
    http.post('/api/auth/login', async ({ request }) => {
      const { email } = (await request.json()) as { email: string };
      const account = accounts[email];
      return account
        ? HttpResponse.json({
            token: tokenExpiringIn(3600, account.id, account.role),
            user: account,
          })
        : HttpResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
            { status: 401 },
          );
    }),
    http.post('/api/auth/register', () =>
      HttpResponse.json({ user: accounts['arnav@example.com'] }, { status: 201 }),
    ),
  );
}

function renderApp(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(<App router={router} />);
  return { router, user: userEvent.setup() };
}

function logInAs(role: Role, expiresInSeconds = 3600) {
  const account =
    role === 'ADMIN' ? accounts['admin@dealership.local']! : accounts['arnav@example.com']!;
  saveSession(tokenExpiringIn(expiresInSeconds, account.id, role), account);
}

async function signIn(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), 'supersecret');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('Drivewright app', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the branded login page to a logged-out visitor', () => {
    renderApp('/');

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getAllByText(/drivewright/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('after signing in, returns the user to the page they originally asked for', async () => {
    mockAuthApi();
    const { router, user } = renderApp('/admin');

    await signIn(user, 'admin@dealership.local');

    expect(await screen.findByRole('heading', { name: /admin/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin');
  });

  it('greets a regular user by first name and hides the Admin link', async () => {
    mockAuthApi();
    const { user } = renderApp('/login');

    await signIn(user, 'arnav@example.com');

    expect(await screen.findByText('Hi, Arnav')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /inventory/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
  });

  it('shows the Admin link to admins', () => {
    logInAs('ADMIN');

    renderApp('/');

    expect(screen.getByRole('link', { name: /^admin$/i })).toHaveAttribute('href', '/admin');
  });

  it('logs out from the navbar and returns to the login page', async () => {
    logInAs('USER');
    const { user } = renderApp('/');

    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('explains on the login page that the session expired', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    logInAs('USER', 30);
    renderApp('/');
    expect(screen.getByText('Hi, Arnav')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(30_000));

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/session has expired/i);
  });

  it('registers a new user and takes them straight to the inventory', async () => {
    mockAuthApi();
    const { user } = renderApp('/register');

    await user.type(screen.getByLabelText(/full name/i), 'Arnav Kataria');
    await user.type(screen.getByLabelText(/email/i), 'arnav@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Hi, Arnav')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /inventory/i })).toBeInTheDocument();
  });

  it('links from the register page back to sign in', () => {
    renderApp('/register');

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('shows a not-found page for unknown addresses', () => {
    logInAs('USER');

    renderApp('/no-such-page');

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
