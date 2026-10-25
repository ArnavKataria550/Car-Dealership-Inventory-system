import { prisma } from '../../src/lib/prisma.js';

/**
 * Guard against wiping real data: only databases whose name ends in "_test"
 * may be reset. Vitest points DATABASE_URL at TEST_DATABASE_URL (vitest.config.ts).
 */
function assertTestDatabase(): void {
  const databaseName = new URL(process.env.DATABASE_URL ?? '').pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to reset non-test database "${databaseName}"`);
  }
}

/** Empties every table so each test starts from a clean state. */
export async function resetDatabase(): Promise<void> {
  assertTestDatabase();
  await prisma.$executeRaw`TRUNCATE TABLE "purchases", "users", "vehicles" RESTART IDENTITY CASCADE`;
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
