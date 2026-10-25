import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import type { Vehicle } from '../../src/generated/prisma/client.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('POST /api/vehicles/:id/purchase', () => {
  const app = createApp();
  let userAuth: string;
  let vehicle: Vehicle;

  beforeEach(async () => {
    await resetDatabase();
    userAuth = (await createUserWithToken('USER')).authHeader;
    vehicle = await createVehicle({ quantity: 3 });
  });
  afterAll(disconnectDatabase);

  const purchase = (id: string, body?: object, auth = userAuth) => {
    const req = request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', auth);
    return body === undefined ? req : req.send(body);
  };

  const storedQuantity = async (id = vehicle.id) =>
    (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

  it('200: buys one unit when no quantity is given and returns the updated vehicle', async () => {
    const response = await purchase(vehicle.id);

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ id: vehicle.id, quantity: 2 });
    expect(await storedQuantity()).toBe(2);
  });

  it('buys the requested quantity', async () => {
    const response = await purchase(vehicle.id, { quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(1);
  });

  it('can buy the entire remaining stock, leaving it at 0', async () => {
    const response = await purchase(vehicle.id, { quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(0);
  });

  it('admins can purchase too', async () => {
    const { authHeader } = await createUserWithToken('ADMIN');

    const response = await purchase(vehicle.id, { quantity: 1 }, authHeader);

    expect(response.status).toBe(200);
  });

  it('409: an out-of-stock vehicle cannot be purchased', async () => {
    const soldOut = await createVehicle({ quantity: 0 });

    const response = await purchase(soldOut.id);

    expect(response.status).toBe(409);
    expect(response.body.error).toEqual({
      code: 'INSUFFICIENT_STOCK',
      message: 'This vehicle is out of stock',
    });
    expect(await storedQuantity(soldOut.id)).toBe(0);
  });

  it('409: cannot buy more than is in stock, and the stock is left unchanged', async () => {
    const response = await purchase(vehicle.id, { quantity: 4 });

    expect(response.status).toBe(409);
    expect(response.body.error).toEqual({
      code: 'INSUFFICIENT_STOCK',
      message: 'Only 3 left in stock',
    });
    expect(await storedQuantity()).toBe(3);
  });

  it.each([
    ['quantity is 0', { quantity: 0 }],
    ['quantity is negative', { quantity: -1 }],
    ['quantity is not a whole number', { quantity: 1.5 }],
    ['quantity is a string', { quantity: '2' }],
  ])('400: when %s', async (_case, body) => {
    const response = await purchase(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'quantity' })]),
    );
    expect(await storedQuantity()).toBe(3);
  });

  it('404: when no vehicle has that id', async () => {
    const response = await purchase('does-not-exist');

    expect(response.status).toBe(404);
    // Exact message, so the catch-all "route not found" 404 cannot satisfy this test.
    expect(response.body.error).toEqual({ code: 'NOT_FOUND', message: 'Vehicle not found' });
  });

  it('401: requires a token', async () => {
    const response = await request(app).post(`/api/vehicles/${vehicle.id}/purchase`);

    expect(response.status).toBe(401);
    expect(await storedQuantity()).toBe(3);
  });
});
