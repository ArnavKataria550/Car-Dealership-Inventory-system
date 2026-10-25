import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { buildVehicleInput } from '../helpers/vehicles.js';

describe('POST /api/vehicles', () => {
  const app = createApp();
  let adminAuth: string;
  let userAuth: string;

  beforeEach(async () => {
    await resetDatabase();
    adminAuth = (await createUserWithToken('ADMIN')).authHeader;
    userAuth = (await createUserWithToken('USER')).authHeader;
  });
  afterAll(disconnectDatabase);

  const postVehicle = (body: object, auth?: string) => {
    const req = request(app).post('/api/vehicles');
    return auth ? req.set('Authorization', auth).send(body) : req.send(body);
  };

  it('201: an admin creates a vehicle and gets it back with an id', async () => {
    const response = await postVehicle(buildVehicleInput(), adminAuth);

    expect(response.status).toBe(201);
    expect(response.body.vehicle).toEqual({
      id: expect.any(String),
      make: 'Toyota',
      model: 'Camry',
      category: 'SEDAN',
      year: 2024,
      color: 'Black',
      priceCents: 2_799_900,
      quantity: 3,
      imageUrl: 'https://images.example.com/toyota-camry-2024.jpg',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    await expect(prisma.vehicle.count()).resolves.toBe(1);
  });

  it('defaults quantity to 0 when it is omitted', async () => {
    // undefined keys are dropped by JSON.stringify, so the body has no quantity.
    const response = await postVehicle(buildVehicleInput({ quantity: undefined }), adminAuth);

    expect(response.status).toBe(201);
    expect(response.body.vehicle.quantity).toBe(0);
  });

  it('accepts the category in any letter case and trims text fields', async () => {
    const response = await postVehicle(
      buildVehicleInput({ category: 'suv', make: '  Honda ', model: ' CR-V ' }),
      adminAuth,
    );

    expect(response.status).toBe(201);
    expect(response.body.vehicle).toMatchObject({ category: 'SUV', make: 'Honda', model: 'CR-V' });
  });

  it('ignores a client-supplied id', async () => {
    const response = await postVehicle(buildVehicleInput({ id: 'my-own-id' }), adminAuth);

    expect(response.status).toBe(201);
    expect(response.body.vehicle.id).not.toBe('my-own-id');
  });

  it('allows duplicate listings of the same car', async () => {
    await postVehicle(buildVehicleInput(), adminAuth).expect(201);

    const response = await postVehicle(buildVehicleInput(), adminAuth);

    expect(response.status).toBe(201);
    await expect(prisma.vehicle.count()).resolves.toBe(2);
  });

  it('401: rejects a request without a token, before validating the body', async () => {
    const response = await postVehicle({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('403: a regular user cannot add vehicles', async () => {
    const response = await postVehicle(buildVehicleInput(), userAuth);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    await expect(prisma.vehicle.count()).resolves.toBe(0);
  });

  const nextYear = new Date().getFullYear() + 1;

  it.each([
    ['make is missing', { make: undefined }, 'make'],
    ['model is blank', { model: '   ' }, 'model'],
    ['make is longer than 50 characters', { make: 'x'.repeat(51) }, 'make'],
    ['color is missing', { color: undefined }, 'color'],
    ['category is not one of the allowed values', { category: 'SPACESHIP' }, 'category'],
    ['year is before 1886', { year: 1885 }, 'year'],
    ['year is after next year', { year: nextYear + 1 }, 'year'],
    ['year is not a whole number', { year: 2020.5 }, 'year'],
    ['priceCents is negative', { priceCents: -1 }, 'priceCents'],
    ['priceCents is not a whole number', { priceCents: 199.5 }, 'priceCents'],
    ['priceCents is a string', { priceCents: '25000' }, 'priceCents'],
    ['quantity is negative', { quantity: -2 }, 'quantity'],
    ['quantity is not a whole number', { quantity: 1.5 }, 'quantity'],
    ['imageUrl is missing', { imageUrl: undefined }, 'imageUrl'],
    ['imageUrl is not a URL', { imageUrl: 'not-a-url' }, 'imageUrl'],
    ['imageUrl is not http(s)', { imageUrl: 'ftp://images.example.com/car.jpg' }, 'imageUrl'],
  ])('400: when %s', async (_case, overrides, field) => {
    const response = await postVehicle(buildVehicleInput(overrides), adminAuth);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })]),
    );
  });

  it(`accepts next year's models (${nextYear})`, async () => {
    const response = await postVehicle(buildVehicleInput({ year: nextYear }), adminAuth);

    expect(response.status).toBe(201);
  });
});
