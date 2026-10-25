import type { Role } from './auth.types.js';

/** A user row as stored, including the password hash. Stays inside the backend. */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  /** Defaults to USER. Only trusted code (e.g. the seed script) sets ADMIN. */
  role?: Role;
}

/**
 * Persistence boundary for users. AuthService depends on this interface,
 * not on Prisma, so it can be unit-tested with an in-memory fake.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: NewUser): Promise<UserRecord>;
}
