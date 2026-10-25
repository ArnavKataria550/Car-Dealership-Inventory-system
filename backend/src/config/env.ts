import 'dotenv/config';

import { z } from 'zod';

/**
 * Shape of the environment the API needs. Parsed once at startup so a
 * missing or malformed variable fails fast with a readable message
 * instead of surfacing later as an obscure runtime error.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  /** bcrypt cost factor. 12 is a sensible production default; tests lower it for speed. */
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
}

export const env: Env = parsed.data;
