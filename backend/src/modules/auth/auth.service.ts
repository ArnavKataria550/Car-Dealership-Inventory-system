import jwt, { type SignOptions } from 'jsonwebtoken';

import { ConflictError, UnauthorizedError } from '../../errors/app-error.js';
import type {
  AuthResult,
  AuthTokenOptions,
  LoginInput,
  PublicUser,
  RegisterInput,
} from './auth.types.js';
import type { PasswordHasher } from './password-hasher.js';
import type { UserRecord, UserRepository } from './user.repository.js';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

/** Registration and login rules. Free of HTTP and database details. */
export class AuthService {
  /** Hash compared against when the email is unknown, so both failure paths cost the same. */
  private dummyPasswordHash?: string;

  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenOptions: AuthTokenOptions,
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

  /**
   * Verifies credentials and issues a signed JWT.
   *
   * An unknown email and a wrong password produce the same error, and both
   * run one hash comparison, so responses do not reveal which emails exist.
   *
   * @throws UnauthorizedError if the credentials do not match an account.
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));

    if (!user) {
      await this.passwordHasher.compare(input.password, await this.getDummyPasswordHash());
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!(await this.passwordHasher.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    return { token: this.signToken(user), user: toPublicUser(user) };
  }

  private signToken(user: UserRecord): string {
    return jwt.sign({ role: user.role }, this.tokenOptions.jwtSecret, {
      algorithm: 'HS256',
      subject: user.id,
      expiresIn: this.tokenOptions.jwtExpiresIn as SignOptions['expiresIn'],
    });
  }

  private async getDummyPasswordHash(): Promise<string> {
    this.dummyPasswordHash ??= await this.passwordHasher.hash('timing-equaliser-not-a-password');
    return this.dummyPasswordHash;
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
