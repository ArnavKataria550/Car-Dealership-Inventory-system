import type {
  NewUser,
  UserRecord,
  UserRepository,
} from '../../../src/modules/auth/user.repository.js';

/** Test double for UserRepository that keeps users in a Map instead of Postgres. */
export class InMemoryUserRepository implements UserRepository {
  private readonly usersByEmail = new Map<string, UserRecord>();
  private nextId = 1;

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.usersByEmail.get(email) ?? null;
  }

  async create(data: NewUser): Promise<UserRecord> {
    const now = new Date();
    const user: UserRecord = {
      id: `user-${this.nextId++}`,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'USER',
      createdAt: now,
      updatedAt: now,
    };
    this.usersByEmail.set(user.email, user);
    return user;
  }
}
