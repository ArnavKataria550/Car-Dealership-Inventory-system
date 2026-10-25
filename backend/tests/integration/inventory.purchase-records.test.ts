import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, prisma, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('purchases are recorded', () => {
  const app = createApp();
  let buyer: Awaited<ReturnType<typeof createUserWithToken>>;

  beforeEach(async () => {
    await resetDatabase();
    buyer = await createUserWithToken('USER');
  });
  afterAll(disconnectDatabase);

  const purchase = (id: string, body?: object) => {
    const req = request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set('Authorization', buyer.authHeader);
    return body ? req.send(body) : req;
  };

  it('stores who bought what, the price paid and a snapshot of the car', async () => {
    const vehicle = await createVehicle({ quantity: 3, priceCents: 3_099_500 });

    await purchase(vehicle.id).expect(200);

    const records = await prisma.purchase.findMany();
    expect(records).toEqual([
      expect.objectContaining({
        buyerId: buyer.user.id,
        vehicleId: vehicle.id,
        quantity: 1,
        unitPriceCents: 3_099_500,
        make: vehicle.make,
        model: vehicle.model,
        category: vehicle.category,
        year: vehicle.year,
        color: vehicle.color,
        imageUrl: vehicle.imageUrl,
      }),
    ]);
  });

  it('records the quantity bought', async () => {
    const vehicle = await createVehicle({ quantity: 3 });

    await purchase(vehicle.id, { quantity: 2 }).expect(200);

    const [record] = await prisma.purchase.findMany();
    expect(record?.quantity).toBe(2);
  });

  it('records nothing when the purchase fails', async () => {
    const soldOut = await createVehicle({ quantity: 0 });

    await purchase(soldOut.id).expect(409);
    await purchase('does-not-exist').expect(404);

    await expect(prisma.purchase.count()).resolves.toBe(0);
  });

  it('records exactly one order per successful sale under concurrency', async () => {
    const vehicle = await createVehicle({ quantity: 5 });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => purchase(vehicle.id, { quantity: 2 })),
    );

    const successes = responses.filter((r) => r.status === 200).length;
    expect(successes).toBe(2);
    await expect(prisma.purchase.count()).resolves.toBe(successes);
  });

  it('keeps the price paid after the listing price changes', async () => {
    const vehicle = await createVehicle({ quantity: 3, priceCents: 3_099_500 });
    await purchase(vehicle.id).expect(200);

    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { priceCents: 1 } });

    const [record] = await prisma.purchase.findMany();
    expect(record?.unitPriceCents).toBe(3_099_500);
  });

  it('keeps the order when the listing is deleted', async () => {
    const vehicle = await createVehicle({ quantity: 3 });
    await purchase(vehicle.id).expect(200);

    await prisma.vehicle.delete({ where: { id: vehicle.id } });

    const [record] = await prisma.purchase.findMany();
    expect(record).toMatchObject({ vehicleId: null, make: vehicle.make, model: vehicle.model });
  });
});
