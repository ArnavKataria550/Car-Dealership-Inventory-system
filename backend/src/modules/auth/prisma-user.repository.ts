import { ConflictError } from '../../errors/app-error.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../lib/prisma-errors.js';
import type { NewUser, UserRecord, UserRepository } from './user.repository.js';

/** UserRepository backed by PostgreSQL through Prisma. */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: NewUser): Promise<UserRecord> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      // Two simultaneous sign-ups can both pass AuthService's duplicate check;
      // the unique index on email is the final word.
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictError('An account with this email already exists');
      }
      throw error;
    }
  }
}
