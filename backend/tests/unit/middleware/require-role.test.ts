import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError, UnauthorizedError } from '../../../src/errors/app-error.js';
import { requireRole } from '../../../src/middleware/require-role.js';
import type { AuthenticatedUser } from '../../../src/modules/auth/auth.types.js';

function runWith(user: AuthenticatedUser | undefined, ...allowed: Parameters<typeof requireRole>) {
  const req = { user } as Request;
  const next = vi.fn();
  requireRole(...allowed)(req, {} as Response, next);
  return next;
}

describe('requireRole middleware', () => {
  it('calls next() when the user has the required role', () => {
    const next = runWith({ id: 'admin-1', role: 'ADMIN' }, 'ADMIN');

    expect(next).toHaveBeenCalledWith();
  });

  it('403: rejects an authenticated user without the required role', () => {
    expect(() => runWith({ id: 'user-1', role: 'USER' }, 'ADMIN')).toThrow(ForbiddenError);
  });

  it('accepts any one of several allowed roles', () => {
    const next = runWith({ id: 'user-1', role: 'USER' }, 'USER', 'ADMIN');

    expect(next).toHaveBeenCalledWith();
  });

  it('401: rejects a request that was never authenticated', () => {
    expect(() => runWith(undefined, 'ADMIN')).toThrow(UnauthorizedError);
  });

  it('ForbiddenError maps to HTTP 403 with code FORBIDDEN', () => {
    const error = new ForbiddenError();

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });
});
