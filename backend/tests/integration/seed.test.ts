import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { BcryptPasswordHasher } from '../../src/modules/auth/password-hasher.js';
import { seedDatabase } from '../../src/seed/seed-database.js';
import { SEED_VEHICLES } from '../../src/seed/seed-vehicles.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { buildVehicleInput, createVehicle } from '../helpers/vehicles.js';

describe('seedDatabase', () => {
  const app = createApp();
  const admin = {
    name: 'Dealership Admin',
    email: 'admin@dealership.test',
    password: 'seed-admin-password',
  };

  const runSeed = (overrides: { environment?: string; password?: string } = {}) =>
    seedDatabase(prisma, {
      environment: overrides.environment ?? 'test',
      admin: { ...admin, password: overrides.password ?? admin.password },
      passwordHasher: new BcryptPasswordHasher(4),
    });

  beforeEach(resetDatabase);
  afterAll(disconnectDatabase);

  it('creates an ADMIN account whose password is stored only as a hash', async () => {
    await runSeed();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: admin.email } });
    expect(stored).toMatchObject({ name: 'Dealership Admin', role: 'ADMIN' });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('the seeded admin can log in and use admin-only endpoints', async () => {
    await runSeed();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: admin.password });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('ADMIN');

    const create = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send(buildVehicleInput());
    expect(create.status).toBe(201);
  });

  it('inserts the whole vehicle catalogue', async () => {
    const result = await runSeed();

    expect(result).toEqual({ adminEmail: admin.email, vehicleCount: SEED_VEHICLES.length });
    const stored = await prisma.vehicle.findMany();
    expect(stored).toHaveLength(SEED_VEHICLES.length);
    expect(stored.map((v) => v.imageUrl).sort()).toEqual(
      SEED_VEHICLES.map((v) => v.imageUrl).sort(),
    );
  });

  it('replaces existing vehicles instead of adding to them', async () => {
    await createVehicle({ make: 'Leftover', model: 'Test Car' });

    await runSeed();

    await expect(prisma.vehicle.count({ where: { make: 'Leftover' } })).resolves.toBe(0);
    await expect(prisma.vehicle.count()).resolves.toBe(SEED_VEHICLES.length);
  });

  it('can be re-run: no duplicates, and the admin password is updated', async () => {
    await runSeed();
    await runSeed({ password: 'a-new-admin-password' });

    await expect(prisma.user.count({ where: { email: admin.email } })).resolves.toBe(1);
    await expect(prisma.vehicle.count()).resolves.toBe(SEED_VEHICLES.length);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'a-new-admin-password' });
    expect(login.status).toBe(200);
  });

  it('leaves regular user accounts alone', async () => {
    const { user } = await createUserWithToken('USER');

    await runSeed();

    await expect(prisma.user.findUnique({ where: { id: user.id } })).resolves.not.toBeNull();
  });

  it('refuses to run in production and changes nothing', async () => {
    await expect(runSeed({ environment: 'production' })).rejects.toThrow(/production/i);

    await expect(prisma.user.count()).resolves.toBe(0);
    await expect(prisma.vehicle.count()).resolves.toBe(0);
  });

  it('rejects an admin password shorter than 8 characters', async () => {
    await expect(runSeed({ password: 'short' })).rejects.toThrow(/password/i);

    await expect(prisma.user.count()).resolves.toBe(0);
  });
});
