import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('GET /api/vehicles/:id', () => {
  const app = createApp();
  let userAuth: string;

  beforeEach(async () => {
    await resetDatabase();
    userAuth = (await createUserWithToken('USER')).authHeader;
  });
  afterAll(disconnectDatabase);

  it('200: returns the vehicle', async () => {
    const vehicle = await createVehicle({ make: 'Mazda', model: 'MX-5 Miata RF', quantity: 2 });

    const response = await request(app)
      .get(`/api/vehicles/${vehicle.id}`)
      .set('Authorization', userAuth);

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({
      id: vehicle.id,
      make: 'Mazda',
      model: 'MX-5 Miata RF',
      quantity: 2,
    });
  });

  it('404: when no vehicle has that id', async () => {
    const response = await request(app)
      .get('/api/vehicles/does-not-exist')
      .set('Authorization', userAuth);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({ code: 'NOT_FOUND', message: 'Vehicle not found' });
  });

  it('401: requires a token', async () => {
    const vehicle = await createVehicle();

    const response = await request(app).get(`/api/vehicles/${vehicle.id}`);

    expect(response.status).toBe(401);
  });

  it('does not swallow /search', async () => {
    await createVehicle({ make: 'Mazda' });

    const response = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'maz' })
      .set('Authorization', userAuth);

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(1);
  });
});
