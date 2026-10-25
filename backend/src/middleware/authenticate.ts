import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { UnauthorizedError } from '../errors/app-error.js';
import { ROLES, type AuthenticatedUser, type Role } from '../modules/auth/auth.types.js';

/**
 * Builds middleware that requires a valid `Authorization: Bearer <jwt>`
 * header and exposes the caller as `req.user`. Any problem with the token
 * is reported as a 401; the request never reaches the route handler.
 */
export function createAuthenticate(jwtSecret: string): RequestHandler {
  return (req, _res, next) => {
    const token = extractBearerToken(req.headers.authorization);
    req.user = verifyToken(token, jwtSecret);
    next();
  };
}

function extractBearerToken(header: string | undefined): string {
  const [scheme, token] = header?.split(' ') ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new UnauthorizedError('Authentication required');
  }
  return token;
}

function verifyToken(token: string, jwtSecret: string): AuthenticatedUser {
  let payload: string | jwt.JwtPayload;
  try {
    // Pinning the algorithm rejects `alg: none` and algorithm-confusion tokens.
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Session has expired, please log in again');
    }
    throw new UnauthorizedError('Invalid token');
  }

  if (typeof payload === 'string' || !payload.sub || !isRole(payload.role)) {
    throw new UnauthorizedError('Invalid token');
  }
  return { id: payload.sub, role: payload.role };
}

function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}
