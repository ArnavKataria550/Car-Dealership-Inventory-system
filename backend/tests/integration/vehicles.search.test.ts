import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';
import { createVehicle } from '../helpers/vehicles.js';

describe('GET /api/vehicles/search', () => {
  const app = createApp();
  let userAuth: string;

  beforeEach(async () => {
    await resetDatabase();
    userAuth = (await createUserWithToken('USER')).authHeader;

    await createVehicle({
      make: 'Toyota',
      model: 'Camry',
      category: 'SEDAN',
      priceCents: 2_799_900,
    });
    await createVehicle({ make: 'Toyota', model: 'RAV4', category: 'SUV', priceCents: 3_299_900 });
    await createVehicle({
      make: 'Honda',
      model: 'Civic',
      category: 'HATCHBACK',
      priceCents: 2_599_900,
    });
    await createVehicle({
      make: 'Ford',
      model: 'F-150',
      category: 'TRUCK',
      priceCents: 4_599_900,
      quantity: 0,
    });
    await createVehicle({ make: 'Tesla', model: 'Model 3', category: 'EV', priceCents: 3_999_900 });
  });
  afterAll(disconnectDatabase);

  /** Runs a search and returns the matching model names, sorted, for easy comparison. */
  async function searchModels(query: Record<string, string | number>) {
    const response = await request(app)
      .get('/api/vehicles/search')
      .query(query)
      .set('Authorization', userAuth);

    expect(response.status).toBe(200);
    return response.body.vehicles.map((vehicle: { model: string }) => vehicle.model).sort();
  }

  it('returns every vehicle when no filters are given', async () => {
    expect(await searchModels({})).toEqual(['Camry', 'Civic', 'F-150', 'Model 3', 'RAV4']);
  });

  it('matches make partially and case-insensitively', async () => {
    expect(await searchModels({ make: 'toy' })).toEqual(['Camry', 'RAV4']);
  });

  it('matches model partially and case-insensitively', async () => {
    expect(await searchModels({ model: 'MODEL' })).toEqual(['Model 3']);
  });

  it('filters by exact category, in any letter case', async () => {
    expect(await searchModels({ category: 'suv' })).toEqual(['RAV4']);
  });

  it('includes out-of-stock vehicles in the results', async () => {
    expect(await searchModels({ category: 'TRUCK' })).toEqual(['F-150']);
  });

  it('filters by minimum price (inclusive)', async () => {
    expect(await searchModels({ minPriceCents: 3_299_900 })).toEqual(['F-150', 'Model 3', 'RAV4']);
  });

  it('filters by maximum price (inclusive)', async () => {
    expect(await searchModels({ maxPriceCents: 2_799_900 })).toEqual(['Camry', 'Civic']);
  });

  it('filters by a price range with both bounds inclusive', async () => {
    expect(await searchModels({ minPriceCents: 2_799_900, maxPriceCents: 3_299_900 })).toEqual([
      'Camry',
      'RAV4',
    ]);
  });

  it('combines filters with AND', async () => {
    expect(await searchModels({ make: 'toyota', category: 'SUV' })).toEqual(['RAV4']);
    expect(await searchModels({ make: 'toyota', maxPriceCents: 3_000_000 })).toEqual(['Camry']);
  });

  it('ignores empty filter values', async () => {
    expect(await searchModels({ make: '', model: '  ' })).toHaveLength(5);
  });

  it('returns an empty list when nothing matches', async () => {
    expect(await searchModels({ make: 'Lamborghini' })).toEqual([]);
  });

  it.each([
    ['category is unknown', { category: 'SPACESHIP' }, 'category'],
    ['minPriceCents is negative', { minPriceCents: -1 }, 'minPriceCents'],
    ['minPriceCents is not a number', { minPriceCents: 'cheap' }, 'minPriceCents'],
    ['maxPriceCents is not a whole number', { maxPriceCents: 1.5 }, 'maxPriceCents'],
    [
      'minPriceCents is greater than maxPriceCents',
      { minPriceCents: 5_000_000, maxPriceCents: 1_000_000 },
      'minPriceCents',
    ],
  ])('400: when %s', async (_case, query, field) => {
    const response = await request(app)
      .get('/api/vehicles/search')
      .query(query)
      .set('Authorization', userAuth);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })]),
    );
  });

  it('401: requires a token', async () => {
    const response = await request(app).get('/api/vehicles/search').query({ make: 'Toyota' });

    expect(response.status).toBe(401);
  });
});
