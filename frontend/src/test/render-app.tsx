import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';

import { App } from '../App';
import { saveSession } from '../auth/session';
import type { Role, User } from '../auth/types';
import { appRoutes } from '../routes/app-routes';
import { tokenExpiringIn } from './tokens';

export const testUsers: Record<Role, User> = {
  USER: {
    id: 'user-1',
    name: 'Arnav Kataria',
    email: 'arnav@example.com',
    role: 'USER',
    createdAt: '2026-10-25T10:00:00.000Z',
  },
  ADMIN: {
    id: 'admin-1',
    name: 'Dealership Admin',
    email: 'admin@dealership.local',
    role: 'ADMIN',
    createdAt: '2026-10-25T10:00:00.000Z',
  },
};

/** Stores a valid session so the app starts logged in as the given role. */
export function logInAs(role: Role) {
  const user = testUsers[role];
  saveSession(tokenExpiringIn(3600, user.id, role), user);
}

/** Renders the whole app (real routes, auth and toasts) at `path` in a memory router. */
export function renderAppAt(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(<App router={router} />);
  return { router, user: userEvent.setup() };
}
