import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildPurchase, buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { createApiClient } from './client';
import { fetchPurchases } from './purchases';
import { fetchVehicle } from './vehicles';

const api = createApiClient({ getToken: () => 'token', onUnauthorized: () => {} });

describe('fetchVehicle', () => {
  it('gets one vehicle by id', async () => {
    const camry = buildVehicle();
    server.use(http.get('/api/vehicles/veh-camry', () => HttpResponse.json({ vehicle: camry })));

    await expect(fetchVehicle(api, 'veh-camry')).resolves.toEqual(camry);
  });
});

describe('fetchPurchases', () => {
  it('returns the purchases list', async () => {
    const purchase = buildPurchase();
    server.use(http.get('/api/purchases', () => HttpResponse.json({ purchases: [purchase] })));

    await expect(fetchPurchases(api)).resolves.toEqual([purchase]);
  });
});
