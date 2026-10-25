import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { createUserWithToken } from '../helpers/auth.js';
import { disconnectDatabase, resetDatabase } from '../helpers/database.js';

describe('unknown routes', () => {
  const app = createApp();

  afterAll(disconnectDatabase);

  it.each([
    ['GET', '/api/does-not-exist'],
    ['POST', '/api/auth/logout'],
    ['GET', '/'],
  ] as const)('404 JSON for %s %s', async (method, path) => {
    const response = await request(app)[method === 'GET' ? 'get' : 'post'](path);

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: `Route ${method} ${path} not found` },
    });
  });

  it('404 JSON for an unknown path under an authenticated router', async () => {
    await resetDatabase();
    const { authHeader } = await createUserWithToken('USER');

    const response = await request(app)
      .get('/api/vehicles/some-id/history')
      .set('Authorization', authHeader);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
