import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import type { Vehicle } from '../../src/generated/prisma/client.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('PUT /api/vehicles/:id', () => {
  const app = createApp();
  let adminAuth: string;
  let userAuth: string;
  let vehicle: Vehicle;

  beforeEach(async () => {
    await resetDatabase();
    adminAuth = (await createUserWithToken('ADMIN')).authHeader;
    userAuth = (await createUserWithToken('USER')).authHeader;
    vehicle = await createVehicle({ createdAt: new Date('2026-01-01T00:00:00Z') });
  });
  afterAll(disconnectDatabase);

  const putVehicle = (id: string, body: object, auth = adminAuth) =>
    request(app).put(`/api/vehicles/${id}`).set('Authorization', auth).send(body);

  it('200: updates only the given fields and leaves the rest unchanged', async () => {
    const response = await putVehicle(vehicle.id, { priceCents: 2_599_900 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({
      id: vehicle.id,
      make: 'Toyota',
      model: 'Camry',
      category: 'SEDAN',
      year: 2024,
      color: 'Black',
      priceCents: 2_599_900,
      quantity: 3,
      imageUrl: vehicle.imageUrl,
    });
  });

  it('persists the change', async () => {
    await putVehicle(vehicle.id, { color: 'Pearl White' });

    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored?.color).toBe('Pearl White');
  });

  it('updates several fields at once, normalising them like create does', async () => {
    const response = await putVehicle(vehicle.id, {
      make: ' Lexus ',
      model: 'ES 350',
      category: 'sedan',
      year: 2025,
      imageUrl: 'https://images.example.com/lexus-es-2025.jpg',
    });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({
      make: 'Lexus',
      model: 'ES 350',
      category: 'SEDAN',
      year: 2025,
      imageUrl: 'https://images.example.com/lexus-es-2025.jpg',
    });
  });

  it('can set the quantity to 0', async () => {
    const response = await putVehicle(vehicle.id, { quantity: 0 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(0);
  });

  it('refreshes updatedAt but never changes id or createdAt', async () => {
    const response = await putVehicle(vehicle.id, {
      id: 'hijacked-id',
      createdAt: '2000-01-01T00:00:00Z',
      color: 'Red',
    });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.id).toBe(vehicle.id);
    expect(response.body.vehicle.createdAt).toBe(vehicle.createdAt.toISOString());
    expect(new Date(response.body.vehicle.updatedAt).getTime()).toBeGreaterThan(
      vehicle.updatedAt.getTime(),
    );
  });

  it.each([
    ['the body is empty', {}],
    ['the body has only unknown fields', { id: 'x', colour: 'Red' }],
  ])('400: when %s', async (_case, body) => {
    const response = await putVehicle(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it.each([
    ['priceCents is negative', { priceCents: -5 }, 'priceCents'],
    ['category is unknown', { category: 'BOAT' }, 'category'],
    ['make is blank', { make: '  ' }, 'make'],
    ['imageUrl is null', { imageUrl: null }, 'imageUrl'],
    ['year is too old', { year: 1800 }, 'year'],
  ])('400: when %s', async (_case, body, field) => {
    const response = await putVehicle(vehicle.id, body);

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })]),
    );
    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored).toEqual(vehicle);
  });

  it('404: when no vehicle has that id', async () => {
    const response = await putVehicle('does-not-exist', { priceCents: 100 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('403: a regular user cannot edit vehicles', async () => {
    const response = await putVehicle(vehicle.id, { priceCents: 1 }, userAuth);

    expect(response.status).toBe(403);
    const stored = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    expect(stored?.priceCents).toBe(vehicle.priceCents);
  });

  it('401: requires a token', async () => {
    const response = await request(app).put(`/api/vehicles/${vehicle.id}`).send({ priceCents: 1 });

    expect(response.status).toBe(401);
  });
});
