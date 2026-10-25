import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

describe('GET /api/health', () => {
  it('responds 200 with { status: "ok" }', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('responds with JSON', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
