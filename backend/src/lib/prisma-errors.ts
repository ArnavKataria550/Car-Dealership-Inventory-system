import { Prisma } from '../generated/prisma/client.js';

/** True when Prisma rejected a write because it would break a unique constraint. */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
