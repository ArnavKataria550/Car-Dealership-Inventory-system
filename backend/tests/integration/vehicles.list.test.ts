import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('GET /api/vehicles', () => {
  const app = createApp();
  let userAuth: string;

  beforeEach(async () => {
    await resetDatabase();
    userAuth = (await createUserWithToken('USER')).authHeader;
  });
  afterAll(disconnectDatabase);

  it('200: returns an empty list when there is no stock', async () => {
    const response = await request(app).get('/api/vehicles').set('Authorization', userAuth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ vehicles: [] });
  });

  it('200: any logged-in user sees every vehicle, including out-of-stock ones', async () => {
    await createVehicle({ make: 'Toyota', model: 'Camry', quantity: 3 });
    await createVehicle({ make: 'Ford', model: 'F-150', category: 'TRUCK', quantity: 0 });

    const response = await request(app).get('/api/vehicles').set('Authorization', userAuth);

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(2);
    expect(response.body.vehicles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ make: 'Ford', model: 'F-150', quantity: 0 }),
        expect.objectContaining({ make: 'Toyota', model: 'Camry', quantity: 3 }),
      ]),
    );
  });

  it('lists the newest vehicles first', async () => {
    await createVehicle({ model: 'Oldest', createdAt: new Date('2026-01-01T00:00:00Z') });
    await createVehicle({ model: 'Newest', createdAt: new Date('2026-03-01T00:00:00Z') });
    await createVehicle({ model: 'Middle', createdAt: new Date('2026-02-01T00:00:00Z') });

    const response = await request(app).get('/api/vehicles').set('Authorization', userAuth);

    expect(response.body.vehicles.map((v: { model: string }) => v.model)).toEqual([
      'Newest',
      'Middle',
      'Oldest',
    ]);
  });

  it('returns every field the frontend needs to render a listing', async () => {
    await createVehicle();

    const response = await request(app).get('/api/vehicles').set('Authorization', userAuth);

    expect(Object.keys(response.body.vehicles[0]).sort()).toEqual(
      [
        'category',
        'color',
        'createdAt',
        'id',
        'imageUrl',
        'make',
        'model',
        'priceCents',
        'quantity',
        'updatedAt',
        'year',
      ].sort(),
    );
  });

  it('401: requires a token', async () => {
    const response = await request(app).get('/api/vehicles');

    expect(response.status).toBe(401);
  });
});
