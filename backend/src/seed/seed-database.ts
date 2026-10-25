import type { PrismaClient } from '../generated/prisma/client.js';
import { toFieldErrors } from '../middleware/zod-field-errors.js';
import { registerSchema } from '../modules/auth/auth.schemas.js';
import type { PasswordHasher } from '../modules/auth/password-hasher.js';
import { SEED_VEHICLES } from './seed-vehicles.js';

export interface SeedOptions {
  /** NODE_ENV of the caller; seeding is refused in production. */
  environment: string;
  admin: { name: string; email: string; password: string };
  passwordHasher: PasswordHasher;
}

export interface SeedResult {
  adminEmail: string;
  vehicleCount: number;
}

/**
 * Loads demo data: upserts the admin account and replaces the vehicle
 * catalogue with SEED_VEHICLES. Safe to re-run. Regular user accounts are
 * never touched. Everything happens in one transaction, so a failure leaves
 * the database as it was.
 */
export async function seedDatabase(
  prisma: PrismaClient,
  { environment, admin, passwordHasher }: SeedOptions,
): Promise<SeedResult> {
  if (environment === 'production') {
    throw new Error('Refusing to seed a production database');
  }

  // The admin must meet the same rules as any registered user.
  const parsed = registerSchema.safeParse(admin);
  if (!parsed.success) {
    const problems = toFieldErrors(parsed.error).map((e) => `${e.field}: ${e.message}`);
    throw new Error(`Invalid seed admin settings - ${problems.join('; ')}`);
  }
  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  const passwordHash = await passwordHasher.hash(parsed.data.password);

  const vehicles = SEED_VEHICLES.map(({ imageCredit: _credit, ...vehicle }) => vehicle);

  await prisma.$transaction([
    prisma.user.upsert({
      where: { email },
      create: { name, email, passwordHash, role: 'ADMIN' },
      update: { name, passwordHash, role: 'ADMIN' },
    }),
    prisma.vehicle.deleteMany(),
    prisma.vehicle.createMany({ data: vehicles }),
  ]);

  return { adminEmail: email, vehicleCount: vehicles.length };
}
