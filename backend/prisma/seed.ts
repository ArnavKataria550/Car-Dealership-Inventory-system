// Entry point for `npm run db:seed` (and `prisma migrate reset`). The logic lives
// in src/seed so it can be tested; this file only reads settings and reports.
import { z } from 'zod';

import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { BcryptPasswordHasher } from '../src/modules/auth/password-hasher.js';
import { seedDatabase } from '../src/seed/seed-database.js';

const seedSettings = z
  .object({
    SEED_ADMIN_NAME: z.string().default('Dealership Admin'),
    SEED_ADMIN_EMAIL: z.string({ error: 'SEED_ADMIN_EMAIL must be set in backend/.env' }),
    SEED_ADMIN_PASSWORD: z.string({ error: 'SEED_ADMIN_PASSWORD must be set in backend/.env' }),
  })
  .parse(process.env);

try {
  const result = await seedDatabase(prisma, {
    environment: env.NODE_ENV,
    admin: {
      name: seedSettings.SEED_ADMIN_NAME,
      email: seedSettings.SEED_ADMIN_EMAIL,
      password: seedSettings.SEED_ADMIN_PASSWORD,
    },
    passwordHasher: new BcryptPasswordHasher(env.BCRYPT_ROUNDS),
  });
  console.log(`Seeded ${result.vehicleCount} vehicles. Admin account: ${result.adminEmail}`);
} finally {
  await prisma.$disconnect();
}
