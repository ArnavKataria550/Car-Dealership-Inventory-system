import type { RequestHandler } from 'express';

import { UnauthorizedError } from '../errors/app-error.js';
import type { TokenService } from '../modules/auth/token.service.js';

/**
 * Builds middleware that requires a valid `Authorization: Bearer <jwt>`
 * header and exposes the caller as `req.user`. Any problem with the token
 * is reported as a 401; the request never reaches the route handler.
 */
export function createAuthenticate(tokens: TokenService): RequestHandler {
  return (req, _res, next) => {
    const token = extractBearerToken(req.headers.authorization);
    req.user = tokens.verify(token);
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
