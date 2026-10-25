import { describe, expect, it } from 'vitest';

import { BcryptPasswordHasher } from '../../../src/modules/auth/password-hasher.js';

describe('BcryptPasswordHasher', () => {
  // Low cost factor keeps the test fast; production uses the configured rounds.
  const hasher = new BcryptPasswordHasher(4);

  it('produces a bcrypt hash using the configured cost', async () => {
    const hash = await hasher.hash('supersecret');

    expect(hash).toMatch(/^\$2[aby]\$04\$/);
    expect(hash).not.toContain('supersecret');
  });

  it('produces a different hash each time (random salt)', async () => {
    const [first, second] = await Promise.all([
      hasher.hash('supersecret'),
      hasher.hash('supersecret'),
    ]);

    expect(first).not.toBe(second);
  });

  it('confirms the correct password and rejects a wrong one', async () => {
    const hash = await hasher.hash('supersecret');

    await expect(hasher.compare('supersecret', hash)).resolves.toBe(true);
    await expect(hasher.compare('wrong-password', hash)).resolves.toBe(false);
  });
});
