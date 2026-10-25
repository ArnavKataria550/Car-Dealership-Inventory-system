import { describe, expect, it } from 'vitest';

import { parseEnv } from '../../../src/config/env.js';

describe('parseEnv', () => {
  const valid = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'x'.repeat(32),
  };

  it('applies defaults for optional settings', () => {
    expect(parseEnv(valid)).toEqual({
      ...valid,
      NODE_ENV: 'development',
      PORT: 4000,
      JWT_EXPIRES_IN: '1h',
      BCRYPT_ROUNDS: 12,
    });
  });

  it('coerces numeric settings from strings', () => {
    const env = parseEnv({ ...valid, PORT: '8080', BCRYPT_ROUNDS: '10' });

    expect(env.PORT).toBe(8080);
    expect(env.BCRYPT_ROUNDS).toBe(10);
  });

  it.each([
    ['DATABASE_URL is missing', { JWT_SECRET: valid.JWT_SECRET }, /DATABASE_URL/],
    ['JWT_SECRET is too short', { ...valid, JWT_SECRET: 'short' }, /at least 32 characters/],
    ['NODE_ENV is unknown', { ...valid, NODE_ENV: 'staging' }, /NODE_ENV/],
    ['BCRYPT_ROUNDS is too low', { ...valid, BCRYPT_ROUNDS: '2' }, /BCRYPT_ROUNDS/],
  ])('throws a readable error when %s', (_case, source, message) => {
    expect(() => parseEnv(source)).toThrow(/Invalid environment configuration/);
    expect(() => parseEnv(source)).toThrow(message);
  });
});
