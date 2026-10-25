import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import type { Vehicle } from '../../src/generated/prisma/client.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

/** Largest value the Postgres INTEGER quantity column can hold. */
const MAX_INT32 = 2_147_483_647;

describe('POST /api/vehicles/:id/restock', () => {
  const app = createApp();
  let adminAuth: string;
  let userAuth: string;
  let vehicle: Vehicle;

  beforeEach(async () => {
    await resetDatabase();
    adminAuth = (await createUserWithToken('ADMIN')).authHeader;
    userAuth = (await createUserWithToken('USER')).authHeader;
    vehicle = await createVehicle({ quantity: 3 });
  });
  afterAll(disconnectDatabase);

  const restock = (id: string, body: object, auth = adminAuth) =>
    request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', auth).send(body);

  const storedQuantity = async (id = vehicle.id) =>
    (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

  it('200: an admin adds stock and gets the updated vehicle back', async () => {
    const response = await restock(vehicle.id, { quantity: 5 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ id: vehicle.id, quantity: 8 });
    expect(await storedQuantity()).toBe(8);
  });

  it('accepts the maximum of 100 units in one request', async () => {
    const response = await restock(vehicle.id, { quantity: 100 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(103);
  });

  it('makes an out-of-stock vehicle purchasable again', async () => {
    const soldOut = await createVehicle({ quantity: 0 });

    await restock(soldOut.id, { quantity: 2 }).expect(200);
    const purchase = await request(app)
      .post(`/api/vehicles/${soldOut.id}/purchase`)
      .set('Authorization', userAuth);

    expect(purchase.status).toBe(200);
    expect(purchase.body.vehicle.quantity).toBe(1);
  });

  it.each([
    ['quantity is missing', {}],
    ['quantity is 0', { quantity: 0 }],
    ['quantity is negative', { quantity: -1 }],
    ['quantity is above the 100-unit cap', { quantity: 101 }],
    ['quantity is not a whole number', { quantity: 2.5 }],
    ['quantity is a string', { quantity: '5' }],
  ])('400: when %s', async (_case, body) => {
    const response = await restock(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'quantity' })]),
    );
    expect(await storedQuantity()).toBe(3);
  });

  it('409: refuses a restock that would exceed the maximum storable stock', async () => {
    const nearlyFull = await createVehicle({ quantity: MAX_INT32 - 50 });

    const response = await restock(nearlyFull.id, { quantity: 100 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    expect(await storedQuantity(nearlyFull.id)).toBe(MAX_INT32 - 50);
  });

  it('404: when no vehicle has that id', async () => {
    const response = await restock('does-not-exist', { quantity: 1 });

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({ code: 'NOT_FOUND', message: 'Vehicle not found' });
  });

  it('403: a regular user cannot restock', async () => {
    const response = await restock(vehicle.id, { quantity: 5 }, userAuth);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(await storedQuantity()).toBe(3);
  });

  it('401: requires a token', async () => {
    const response = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .send({ quantity: 5 });

    expect(response.status).toBe(401);
    expect(await storedQuantity()).toBe(3);
  });
});
