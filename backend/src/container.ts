import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordHasher } from './modules/auth/password-hasher.js';
import { PrismaUserRepository } from './modules/auth/prisma-user.repository.js';

/** Everything the HTTP layer needs. Tests can pass their own to createApp(). */
export interface AppDependencies {
  authService: AuthService;
}

/** Composition root: the one place where concrete implementations are chosen. */
export function createDependencies(): AppDependencies {
  const users = new PrismaUserRepository(prisma);
  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);

  return {
    authService: new AuthService(users, passwordHasher),
  };
}
