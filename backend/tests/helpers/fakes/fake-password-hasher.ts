import type { PasswordHasher } from '../../../src/modules/auth/password-hasher.js';

/**
 * Deterministic, instant PasswordHasher for unit tests. The real bcrypt
 * implementation has its own tests; here we only need a visible transform.
 */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
