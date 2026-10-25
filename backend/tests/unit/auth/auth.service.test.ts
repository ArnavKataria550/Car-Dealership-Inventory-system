import { beforeEach, describe, expect, it } from 'vitest';

import { ConflictError } from '../../../src/errors/app-error.js';
import { AuthService } from '../../../src/modules/auth/auth.service.js';
import { FakePasswordHasher } from '../../helpers/fakes/fake-password-hasher.js';
import { InMemoryUserRepository } from '../../helpers/fakes/in-memory-user-repository.js';

describe('AuthService.register', () => {
  const validInput = { name: 'Arnav Kataria', email: 'arnav@example.com', password: 'supersecret' };

  let users: InMemoryUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    authService = new AuthService(users, new FakePasswordHasher());
  });

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
