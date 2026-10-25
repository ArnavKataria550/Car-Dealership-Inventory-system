import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

/** Inserts a purchase directly, with a chosen date, for listing tests. */
async function recordPurchase(
  buyerId: string,
  vehicleId: string | null,
  overrides: { quantity?: number; unitPriceCents?: number; createdAt?: Date; model?: string } = {},
) {
  return prisma.purchase.create({
    data: {
      buyerId,
      vehicleId,
      quantity: overrides.quantity ?? 1,
      unitPriceCents: overrides.unitPriceCents ?? 3_099_500,
      make: 'Toyota',
      model: overrides.model ?? 'Camry XSE',
      category: 'SEDAN',
      year: 2023,
      color: 'Celestial Silver',
      imageUrl: 'https://images.example.com/camry.jpg',
      createdAt: overrides.createdAt,
    },
  });
}

describe('GET /api/purchases', () => {
  const app = createApp();
  let alice: Awaited<ReturnType<typeof createUserWithToken>>;
  let bob: Awaited<ReturnType<typeof createUserWithToken>>;
  let admin: Awaited<ReturnType<typeof createUserWithToken>>;
  let vehicleId: string;

  beforeEach(async () => {
    await resetDatabase();
    alice = await createUserWithToken('USER');
    bob = await createUserWithToken('USER');
    admin = await createUserWithToken('ADMIN');
    vehicleId = (await createVehicle()).id;
  });
  afterAll(disconnectDatabase);

  const listAs = (authHeader: string) =>
    request(app).get('/api/purchases').set('Authorization', authHeader);

  it('401: requires a token', async () => {
    const response = await request(app).get('/api/purchases');

    expect(response.status).toBe(401);
  });

  it('returns an empty list when nothing has been bought', async () => {
    const response = await listAs(alice.authHeader);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ purchases: [] });
  });

  it('a regular user sees only their own purchases, newest first', async () => {
    await recordPurchase(alice.user.id, vehicleId, {
      model: 'Older',
      createdAt: new Date('2026-10-01T10:00:00Z'),
    });
    await recordPurchase(bob.user.id, vehicleId, { model: "Bob's car" });
    await recordPurchase(alice.user.id, vehicleId, {
      model: 'Newer',
      createdAt: new Date('2026-10-20T10:00:00Z'),
    });

    const response = await listAs(alice.authHeader);

    expect(response.status).toBe(200);
    expect(
      response.body.purchases.map((p: { vehicle: { model: string } }) => p.vehicle.model),
    ).toEqual(['Newer', 'Older']);
  });

  it('describes each purchase: car snapshot, price paid, total, date, buyer', async () => {
    const record = await recordPurchase(alice.user.id, vehicleId, {
      quantity: 2,
      unitPriceCents: 3_099_500,
      createdAt: new Date('2026-10-20T10:00:00Z'),
    });

    const response = await listAs(alice.authHeader);

    expect(response.body.purchases).toEqual([
      {
        id: record.id,
        vehicleId,
        quantity: 2,
        unitPriceCents: 3_099_500,
        totalCents: 6_199_000,
        purchasedAt: '2026-10-20T10:00:00.000Z',
        vehicle: {
          make: 'Toyota',
          model: 'Camry XSE',
          category: 'SEDAN',
          year: 2023,
          color: 'Celestial Silver',
          imageUrl: 'https://images.example.com/camry.jpg',
        },
        buyer: { id: alice.user.id, name: alice.user.name, email: alice.user.email },
      },
    ]);
  });

  it('an admin sees every purchase with who made it', async () => {
    await recordPurchase(alice.user.id, vehicleId);
    await recordPurchase(bob.user.id, vehicleId);

    const response = await listAs(admin.authHeader);

    const buyers = response.body.purchases.map((p: { buyer: { id: string } }) => p.buyer.id);
    expect(buyers.sort()).toEqual([alice.user.id, bob.user.id].sort());
  });

  it('still lists purchases of vehicles that were later deleted', async () => {
    await recordPurchase(alice.user.id, null);

    const response = await listAs(alice.authHeader);

    expect(response.body.purchases).toEqual([
      expect.objectContaining({
        vehicleId: null,
        vehicle: expect.objectContaining({ make: 'Toyota' }),
      }),
    ]);
  });
});
