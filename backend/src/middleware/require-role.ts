import type { RequestHandler } from 'express';

import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import type { Role } from '../modules/auth/auth.types.js';

/**
 * Allows the request through only if `req.user` has one of the given roles.
 * Must run after authenticate, e.g. `router.delete('/:id', authenticate, requireRole('ADMIN'), ...)`.
 */
export function requireRole(...allowedRoles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}
