import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import type { Vehicle } from '../../src/generated/prisma/client.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('DELETE /api/vehicles/:id', () => {
  const app = createApp();
  let adminAuth: string;
  let userAuth: string;
  let vehicle: Vehicle;

  beforeEach(async () => {
    await resetDatabase();
    adminAuth = (await createUserWithToken('ADMIN')).authHeader;
    userAuth = (await createUserWithToken('USER')).authHeader;
    vehicle = await createVehicle();
  });
  afterAll(disconnectDatabase);

  const deleteVehicle = (id: string, auth = adminAuth) =>
    request(app).delete(`/api/vehicles/${id}`).set('Authorization', auth);

  it('204: an admin deletes the vehicle; the response has no body', async () => {
    const response = await deleteVehicle(vehicle.id);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    await expect(prisma.vehicle.findUnique({ where: { id: vehicle.id } })).resolves.toBeNull();
  });

  it('removes only the targeted vehicle', async () => {
    const other = await createVehicle({ model: 'Corolla' });

    await deleteVehicle(vehicle.id).expect(204);

    const remaining = await prisma.vehicle.findMany();
    expect(remaining.map((v) => v.id)).toEqual([other.id]);
  });

  it('the deleted vehicle no longer appears in the list', async () => {
    await deleteVehicle(vehicle.id).expect(204);

    const response = await request(app).get('/api/vehicles').set('Authorization', userAuth);
    expect(response.body.vehicles).toEqual([]);
  });

  it('404: when no vehicle has that id (including one already deleted)', async () => {
    await deleteVehicle(vehicle.id).expect(204);

    const response = await deleteVehicle(vehicle.id);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('403: a regular user cannot delete vehicles', async () => {
    const response = await deleteVehicle(vehicle.id, userAuth);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    await expect(prisma.vehicle.count()).resolves.toBe(1);
  });

  it('401: requires a token', async () => {
    const response = await request(app).delete(`/api/vehicles/${vehicle.id}`);

    expect(response.status).toBe(401);
    await expect(prisma.vehicle.count()).resolves.toBe(1);
  });
});
