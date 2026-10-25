import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ConflictError } from '../../src/errors/app-error.js';
import { PrismaUserRepository } from '../../src/modules/auth/prisma-user.repository.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';

describe('PrismaUserRepository', () => {
  const users = new PrismaUserRepository(prisma);
  const newUser = { name: 'Race Condition', email: 'race@example.com', passwordHash: 'hash' };

  beforeEach(resetDatabase);
  afterAll(disconnectDatabase);

  it('turns a duplicate-email insert into ConflictError (the unique index is the final guard)', async () => {
    await users.create(newUser);

    await expect(users.create(newUser)).rejects.toBeInstanceOf(ConflictError);
  });

  it('lets exactly one of two simultaneous sign-ups with the same email through', async () => {
    const results = await Promise.allSettled([users.create(newUser), users.create(newUser)]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(ConflictError);
    await expect(prisma.user.count()).resolves.toBe(1);
  });

  it('passes other database errors through unchanged', async () => {
    // A null email violates NOT NULL, a different constraint from the unique index.
    const invalidUser = { ...newUser, email: null as unknown as string };

    await expect(users.create(invalidUser)).rejects.not.toBeInstanceOf(ConflictError);
  });
});
