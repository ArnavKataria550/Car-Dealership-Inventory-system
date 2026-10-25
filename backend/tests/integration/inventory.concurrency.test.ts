import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('concurrent purchases', () => {
  const app = createApp();
  let userAuth: string;

  beforeEach(async () => {
    await resetDatabase();
    userAuth = (await createUserWithToken('USER')).authHeader;
  });
  afterAll(disconnectDatabase);

  /** Fires all purchases at once and returns their HTTP status codes. */
  async function purchaseSimultaneously(vehicleId: string, buyers: number, quantity = 1) {
    const responses = await Promise.all(
      Array.from({ length: buyers }, () =>
        request(app)
          .post(`/api/vehicles/${vehicleId}/purchase`)
          .set('Authorization', userAuth)
          .send({ quantity }),
      ),
    );
    return responses.map((response) => response.status);
  }

  it('10 buyers race for the last unit: exactly one succeeds, nobody oversells', async () => {
    const vehicle = await createVehicle({ quantity: 1 });

    const statuses = await purchaseSimultaneously(vehicle.id, 10);

    expect(statuses.filter((status) => status === 200)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(9);
    const stored = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(stored.quantity).toBe(0);
  });

  it('5 buyers each want 2 of 5 units: two succeed and 1 unit is left', async () => {
    const vehicle = await createVehicle({ quantity: 5 });

    const statuses = await purchaseSimultaneously(vehicle.id, 5, 2);

    expect(statuses.filter((status) => status === 200)).toHaveLength(2);
    expect(statuses.filter((status) => status === 409)).toHaveLength(3);
    const stored = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    expect(stored.quantity).toBe(1);
  });
});
