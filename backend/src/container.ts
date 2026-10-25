import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordHasher } from './modules/auth/password-hasher.js';
import { PrismaUserRepository } from './modules/auth/prisma-user.repository.js';
import { JwtTokenService, type TokenService } from './modules/auth/token.service.js';
import { PrismaVehicleRepository } from './modules/vehicles/prisma-vehicle.repository.js';
import { VehicleService } from './modules/vehicles/vehicle.service.js';

/** Everything the HTTP layer needs. Tests can pass their own to createApp(). */
export interface AppDependencies {
  authService: AuthService;
  /** Shared with the authenticate middleware that guards protected routes. */
  tokenService: TokenService;
  vehicleService: VehicleService;
}

/** Composition root: the one place where concrete implementations are chosen. */
export function createDependencies(): AppDependencies {
  const users = new PrismaUserRepository(prisma);
  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

  return {
    authService: new AuthService(users, passwordHasher, tokenService),
    tokenService,
    vehicleService: new VehicleService(new PrismaVehicleRepository(prisma)),
  };
}
