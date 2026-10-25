import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AuthProvider } from '../auth/AuthProvider';
import { useAuth } from '../auth/auth-context';
import { saveSession } from '../auth/session';
import type { Role } from '../auth/types';
import { tokenExpiringIn } from '../test/tokens';
import { AdminRoute, GuestOnlyRoute, ProtectedRoute } from './guards';

function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  return <p>Login page (from: {from ?? 'none'})</p>;
}

function DashboardProbe() {
  const { logout } = useAuth();
  return (
    <>
      <p>Dashboard</p>
      <button onClick={() => logout()}>Log out</button>
    </>
  );
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <DashboardProbe /> },
          {
            element: <AdminRoute />,
            children: [{ path: '/admin', element: <p>Admin panel</p> }],
          },
        ],
      },
      {
        element: <GuestOnlyRoute />,
        children: [{ path: '/login', element: <LoginProbe /> }],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

function logInAs(role: Role) {
  saveSession(tokenExpiringIn(3600, 'user-1', role), {
    id: 'user-1',
    name: 'Arnav Kataria',
    email: 'arnav@example.com',
    role,
    createdAt: '2026-10-25T10:00:00.000Z',
  });
}

describe('route guards', () => {
  it('sends a logged-out visitor to /login, remembering the page they wanted', () => {
    renderAt('/');

    expect(screen.getByText('Login page (from: /)')).toBeInTheDocument();
  });

  it('sends a logged-out visitor of /admin to /login as well', () => {
    renderAt('/admin');

    expect(screen.getByText('Login page (from: /admin)')).toBeInTheDocument();
  });

  it('lets a logged-in user see protected pages', () => {
    logInAs('USER');

    renderAt('/');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows a regular user a friendly "no access" page for /admin', () => {
    logInAs('USER');

    renderAt('/admin');

    expect(screen.getByRole('heading', { name: /you don't have access/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to inventory/i })).toHaveAttribute('href', '/');
    expect(screen.queryByText('Admin panel')).not.toBeInTheDocument();
  });

  it('lets an admin into /admin', () => {
    logInAs('ADMIN');

    renderAt('/admin');

    expect(screen.getByText('Admin panel')).toBeInTheDocument();
  });

  it('redirects a logged-in user away from the login page', () => {
    logInAs('USER');

    const router = renderAt('/login');

    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('returns to the login page as soon as the user logs out', async () => {
    logInAs('USER');
    renderAt('/');

    await act(() => userEvent.click(screen.getByRole('button', { name: /log out/i })));

    expect(screen.getByText(/^Login page/)).toBeInTheDocument();
  });
});
