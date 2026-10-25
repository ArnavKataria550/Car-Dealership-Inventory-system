import { z } from 'zod';

/** bcrypt only looks at the first 72 bytes, so longer passwords are rejected up front. */
const BCRYPT_MAX_BYTES = 72;

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string({ error: 'Email is required' }).trim().pipe(z.email('Email is invalid')),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= BCRYPT_MAX_BYTES,
      'Password must be at most 72 characters',
    ),
});

export type RegisterBody = z.infer<typeof registerSchema>;

/** Login only checks presence/shape; password rules are enforced at registration. */
export const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).trim().pipe(z.email('Email is invalid')),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginBody = z.infer<typeof loginSchema>;
