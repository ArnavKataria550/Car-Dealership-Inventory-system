import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildVehicle } from '../test/fixtures';
import { server } from '../test/msw-server';
import { createApiClient } from './client';
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  purchaseVehicle,
  restockVehicle,
  updateVehicle,
} from './vehicles';

const api = createApiClient({ getToken: () => 'token', onUnauthorized: () => {} });
const camry = buildVehicle();

describe('vehicles api', () => {
  it('fetchVehicles uses GET /vehicles when no filter is set', async () => {
    server.use(http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [camry] })));

    await expect(fetchVehicles(api, {})).resolves.toEqual([camry]);
  });

  it('fetchVehicles treats blank filters as no filters', async () => {
    server.use(http.get('/api/vehicles', () => HttpResponse.json({ vehicles: [camry] })));

    await expect(fetchVehicles(api, { make: '  ', model: '' })).resolves.toEqual([camry]);
  });

  it('fetchVehicles uses /vehicles/search with only the filters that are set', async () => {
    let search = '';
    server.use(
      http.get('/api/vehicles/search', ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({ vehicles: [camry] });
      }),
    );

    await fetchVehicles(api, { make: ' toy ', category: 'SEDAN', maxPriceCents: 3_500_000 });

    expect(search).toBe('?make=toy&category=SEDAN&maxPriceCents=3500000');
  });

  it('createVehicle posts the input and returns the created vehicle', async () => {
    let body: unknown;
    server.use(
      http.post('/api/vehicles', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ vehicle: camry }, { status: 201 });
      }),
    );
    const { id: _id, createdAt: _c, updatedAt: _u, ...input } = camry;

    await expect(createVehicle(api, input)).resolves.toEqual(camry);
    expect(body).toEqual(input);
  });

  it('updateVehicle sends only the given changes', async () => {
    let body: unknown;
    server.use(
      http.put('/api/vehicles/veh-camry', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ vehicle: { ...camry, priceCents: 2_999_900 } });
      }),
    );

    const updated = await updateVehicle(api, 'veh-camry', { priceCents: 2_999_900 });

    expect(body).toEqual({ priceCents: 2_999_900 });
    expect(updated.priceCents).toBe(2_999_900);
  });

  it('deleteVehicle sends DELETE and resolves when the API answers 204', async () => {
    let deleted = false;
    server.use(
      http.delete('/api/vehicles/veh-camry', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await deleteVehicle(api, 'veh-camry');

    expect(deleted).toBe(true);
  });

  it('purchaseVehicle buys a single unit and returns the updated vehicle', async () => {
    let body: unknown = 'not called';
    server.use(
      http.post('/api/vehicles/veh-camry/purchase', async ({ request }) => {
        body = await request.text();
        return HttpResponse.json({ vehicle: { ...camry, quantity: 3 } });
      }),
    );

    const updated = await purchaseVehicle(api, 'veh-camry');

    expect(body).toBe('');
    expect(updated.quantity).toBe(3);
  });

  it('restockVehicle sends the quantity and returns the updated vehicle', async () => {
    let body: unknown;
    server.use(
      http.post('/api/vehicles/veh-camry/restock', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ vehicle: { ...camry, quantity: 9 } });
      }),
    );

    const updated = await restockVehicle(api, 'veh-camry', 5);

    expect(body).toEqual({ quantity: 5 });
    expect(updated.quantity).toBe(9);
  });

  it('escapes ids in the URL', async () => {
    let path = '';
    server.use(
      http.post('/api/vehicles/:id/purchase', ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ vehicle: camry });
      }),
    );

    await purchaseVehicle(api, 'a/b?c');

    expect(path).toBe('/api/vehicles/a%2Fb%3Fc/purchase');
  });
});
