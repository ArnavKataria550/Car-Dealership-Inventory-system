import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';

import { ConflictError, UnauthorizedError } from '../../../src/errors/app-error.js';
import { AuthService } from '../../../src/modules/auth/auth.service.js';
import { JwtTokenService } from '../../../src/modules/auth/token.service.js';
import { FakePasswordHasher } from '../../helpers/fakes/fake-password-hasher.js';
import { InMemoryUserRepository } from '../../helpers/fakes/in-memory-user-repository.js';

const TEST_JWT_SECRET = 'unit-test-secret-that-is-at-least-32-chars';
const validInput = { name: 'Arnav Kataria', email: 'arnav@example.com', password: 'supersecret' };

let users: InMemoryUserRepository;
let authService: AuthService;

beforeEach(() => {
  users = new InMemoryUserRepository();
  authService = new AuthService(
    users,
    new FakePasswordHasher(),
    new JwtTokenService(TEST_JWT_SECRET, '1h'),
  );
});

describe('AuthService.register', () => {
  it('creates a user and returns it without the password hash', async () => {
    const user = await authService.register(validInput);

    expect(user).toMatchObject({ name: 'Arnav Kataria', email: 'arnav@example.com', role: 'USER' });
    expect(user.id).toEqual(expect.any(String));
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('stores a hash of the password, never the plain text', async () => {
    await authService.register(validInput);

    const stored = await users.findByEmail('arnav@example.com');
    expect(stored?.passwordHash).toBe('hashed:supersecret');
  });

  it('trims and lower-cases the email before saving', async () => {
    const user = await authService.register({ ...validInput, email: '  Arnav@Example.COM ' });

    expect(user.email).toBe('arnav@example.com');
  });

  it('trims surrounding whitespace from the name', async () => {
    const user = await authService.register({ ...validInput, name: '  Arnav Kataria  ' });

    expect(user.name).toBe('Arnav Kataria');
  });

  it('rejects an email that is already registered, ignoring case', async () => {
    await authService.register(validInput);

    await expect(
      authService.register({ ...validInput, email: 'ARNAV@example.com' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('always registers as USER, even if a role is smuggled into the input', async () => {
    const inputWithRole = { ...validInput, role: 'ADMIN' };

    const user = await authService.register(inputWithRole);

    expect(user.role).toBe('USER');
  });
});

describe('AuthService.login', () => {
  beforeEach(async () => {
    await authService.register(validInput);
  });

  it('returns a signed JWT carrying the user id and role', async () => {
    const { token, user } = await authService.login({
      email: 'arnav@example.com',
      password: 'supersecret',
    });

    const payload = jwt.verify(token, TEST_JWT_SECRET) as jwt.JwtPayload;
    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe('USER');
  });

  it('issues a token that expires after the configured lifetime', async () => {
    const { token } = await authService.login({
      email: 'arnav@example.com',
      password: 'supersecret',
    });

    const payload = jwt.verify(token, TEST_JWT_SECRET) as jwt.JwtPayload;
    expect(payload.exp! - payload.iat!).toBe(60 * 60);
  });

  it('returns the user without the password hash', async () => {
    const { user } = await authService.login({
      email: 'arnav@example.com',
      password: 'supersecret',
    });

    expect(user).toMatchObject({ email: 'arnav@example.com', role: 'USER' });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('matches the email case-insensitively', async () => {
    const { user } = await authService.login({
      email: ' ARNAV@example.com ',
      password: 'supersecret',
    });

    expect(user.email).toBe('arnav@example.com');
  });

  it('rejects a wrong password with UnauthorizedError', async () => {
    await expect(
      authService.login({ email: 'arnav@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('gives the same error for an unknown email as for a wrong password', async () => {
    const wrongPassword = authService.login({
      email: 'arnav@example.com',
      password: 'wrong-password',
    });
    const unknownEmail = authService.login({
      email: 'nobody@example.com',
      password: 'supersecret',
    });

    const [a, b] = await Promise.allSettled([wrongPassword, unknownEmail]);
    expect(a.status).toBe('rejected');
    expect(b.status).toBe('rejected');
    expect((a as PromiseRejectedResult).reason).toBeInstanceOf(UnauthorizedError);
    expect((b as PromiseRejectedResult).reason).toEqual((a as PromiseRejectedResult).reason);
  });
});
