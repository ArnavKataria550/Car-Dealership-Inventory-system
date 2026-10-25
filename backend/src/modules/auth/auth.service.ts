import { ConflictError } from '../../errors/app-error.js';
import type { PublicUser, RegisterInput } from './auth.types.js';
import type { PasswordHasher } from './password-hasher.js';
import type { UserRecord, UserRepository } from './user.repository.js';

/** Registration and login rules. Free of HTTP and database details. */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  /**
   * Creates a new USER account. The role is never taken from the input,
   * so nobody can register themselves as an admin.
   *
   * @throws ConflictError if the email is already registered (case-insensitive).
   */
  async register(input: RegisterInput): Promise<PublicUser> {
    const email = normalizeEmail(input.email);

    if (await this.users.findByEmail(email)) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({ name: input.name.trim(), email, passwordHash });

    return toPublicUser(user);
  }
}

/** Emails are stored trimmed and lower-cased so lookups are case-insensitive. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Strips internal fields (password hash, updatedAt) before data leaves the service. */
export function toPublicUser(user: UserRecord): PublicUser {
  const { id, name, email, role, createdAt } = user;
  return { id, name, email, role, createdAt };
}
