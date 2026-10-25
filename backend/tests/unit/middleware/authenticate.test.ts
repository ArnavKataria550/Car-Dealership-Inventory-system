import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';

import { UnauthorizedError } from '../../../src/errors/app-error.js';
import { createAuthenticate } from '../../../src/middleware/authenticate.js';

const SECRET = 'middleware-test-secret-at-least-32-chars';
const authenticate = createAuthenticate(SECRET);

/** Runs the middleware against a fake request carrying the given Authorization header. */
function runWith(authorization?: string) {
  const req = { headers: authorization ? { authorization } : {} } as Request;
  const next = vi.fn();
  authenticate(req, {} as Response, next);
  return { req, next };
}

function signToken(payload: object, options: jwt.SignOptions = {}, secret = SECRET): string {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h', ...options });
}

/** Hand-built token with `alg: none` and no signature: must never be accepted. */
function unsignedToken(payload: object): string {
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
}

describe('authenticate middleware', () => {
  it('attaches the user from a valid Bearer token and calls next()', () => {
    const token = signToken({ role: 'ADMIN' }, { subject: 'user-42' });

    const { req, next } = runWith(`Bearer ${token}`);

    expect(req.user).toEqual({ id: 'user-42', role: 'ADMIN' });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ['there is no Authorization header', undefined],
    ['the scheme is not Bearer', 'Basic dXNlcjpwYXNz'],
    ['the Bearer token is empty', 'Bearer '],
    ['the token is not a JWT', 'Bearer not-a-real-token'],
  ])('rejects with 401 when %s', (_case, header) => {
    expect(() => runWith(header)).toThrow(UnauthorizedError);
  });

  it('rejects a token signed with a different secret', () => {
    const forged = signToken(
      { role: 'ADMIN' },
      { subject: 'user-42' },
      'some-other-secret-32-chars-long!!',
    );

    expect(() => runWith(`Bearer ${forged}`)).toThrow(UnauthorizedError);
  });

  it('rejects an unsigned (alg: none) token', () => {
    const token = unsignedToken({ sub: 'user-42', role: 'ADMIN' });

    expect(() => runWith(`Bearer ${token}`)).toThrow(UnauthorizedError);
  });

  it('rejects an expired token and says so', () => {
    // Signed directly: `exp` in the payload cannot be combined with the helper's expiresIn.
    const expired = jwt.sign(
      { sub: 'user-42', role: 'USER', exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET,
      { algorithm: 'HS256' },
    );

    expect(() => runWith(`Bearer ${expired}`)).toThrow(/expired/i);
  });

  it.each([
    ['has no subject', { role: 'USER' }, {}],
    ['has an unknown role', { role: 'SUPERUSER' }, { subject: 'user-42' }],
  ])('rejects a validly signed token that %s', (_case, payload, options) => {
    const token = signToken(payload, options);

    expect(() => runWith(`Bearer ${token}`)).toThrow(UnauthorizedError);
  });

  it('does not call next() when authentication fails', () => {
    const next = vi.fn();

    expect(() => authenticate({ headers: {} } as Request, {} as Response, next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });
});
