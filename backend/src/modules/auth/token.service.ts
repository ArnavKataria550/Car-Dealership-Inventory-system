import jwt, { type SignOptions } from 'jsonwebtoken';

import { UnauthorizedError } from '../../errors/app-error.js';
import { ROLES, type AuthenticatedUser, type Role } from './auth.types.js';

/** Issues and checks access tokens. The single owner of the JWT secret and algorithm. */
export interface TokenService {
  sign(user: AuthenticatedUser): string;
  /** @throws UnauthorizedError if the token is invalid, tampered with or expired. */
  verify(token: string): AuthenticatedUser;
}

const ALGORITHM = 'HS256';

export class JwtTokenService implements TokenService {
  /**
   * @param secret HMAC signing key (at least 32 characters, enforced by env config).
   * @param expiresIn token lifetime in `ms`-style notation, e.g. "1h".
   */
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(user: AuthenticatedUser): string {
    return jwt.sign({ role: user.role }, this.secret, {
      algorithm: ALGORITHM,
      subject: user.id,
      expiresIn: this.expiresIn as SignOptions['expiresIn'],
    });
  }

  verify(token: string): AuthenticatedUser {
    let payload: string | jwt.JwtPayload;
    try {
      // Pinning the algorithm rejects `alg: none` and algorithm-confusion tokens.
      payload = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });
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
}

function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}
