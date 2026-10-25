import type { AuthenticatedUser } from '../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware; undefined on public routes. */
      user?: AuthenticatedUser;
    }
  }
}

export {};
