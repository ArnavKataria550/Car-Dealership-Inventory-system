import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../test/msw-server';
import { ApiError, createApiClient } from './client';

function setup(token: string | null = 'test-token') {
  const onUnauthorized = vi.fn();
  const api = createApiClient({ getToken: () => token, onUnauthorized });
  return { api, onUnauthorized };
}

describe('createApiClient', () => {
  it('sends the bearer token and returns the parsed JSON body', async () => {
    let authorization: string | null = null;
    server.use(
      http.get('/api/vehicles', ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ vehicles: [] });
      }),
    );
    const { api } = setup('abc.def.ghi');

    await expect(api.get('/vehicles')).resolves.toEqual({ vehicles: [] });
    expect(authorization).toBe('Bearer abc.def.ghi');
  });

  it('sends no Authorization header when there is no token', async () => {
    let hasAuthorization = true;
    server.use(
      http.post('/api/auth/login', ({ request }) => {
        hasAuthorization = request.headers.has('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    const { api } = setup(null);

    await api.post('/auth/login', { email: 'a@b.co', password: 'x' });

    expect(hasAuthorization).toBe(false);
  });

  it('sends bodies as JSON', async () => {
    let received: unknown;
    let contentType: string | null = null;
    server.use(
      http.put('/api/vehicles/v1', async ({ request }) => {
        contentType = request.headers.get('Content-Type');
        received = await request.json();
        return HttpResponse.json({ vehicle: { id: 'v1' } });
      }),
    );
    const { api } = setup();

    await api.put('/vehicles/v1', { priceCents: 100 });

    expect(contentType).toBe('application/json');
    expect(received).toEqual({ priceCents: 100 });
  });

  it('adds query parameters, skipping empty and undefined values', async () => {
    let search = '';
    server.use(
      http.get('/api/vehicles/search', ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({ vehicles: [] });
      }),
    );
    const { api } = setup();

    await api.get('/vehicles/search', {
      query: { make: 'toy ota', model: '', category: undefined, maxPriceCents: 3000000 },
    });

    expect(search).toBe('?make=toy+ota&maxPriceCents=3000000');
  });

  it('resolves to undefined for 204 No Content', async () => {
    server.use(http.delete('/api/vehicles/v1', () => new HttpResponse(null, { status: 204 })));
    const { api } = setup();

    await expect(api.delete('/vehicles/v1')).resolves.toBeUndefined();
  });

  it("turns the API's error envelope into an ApiError", async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request body is invalid',
              details: [{ field: 'email', message: 'Email is invalid' }],
            },
          },
          { status: 400 },
        ),
      ),
    );
    const { api } = setup(null);

    const error = await api.post('/auth/register', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request body is invalid',
      details: [{ field: 'email', message: 'Email is invalid' }],
    });
  });

  it('gives a generic ApiError when an error response is not JSON', async () => {
    server.use(
      http.get('/api/vehicles', () => new HttpResponse('<h1>Bad gateway</h1>', { status: 502 })),
    );
    const { api } = setup();

    await expect(api.get('/vehicles')).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.',
    });
  });

  it('gives a friendly ApiError when the server cannot be reached', async () => {
    server.use(http.get('/api/vehicles', () => HttpResponse.error()));
    const { api } = setup();

    await expect(api.get('/vehicles')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: "Can't reach the server. Check your connection and try again.",
    });
  });

  it('calls onUnauthorized when a request made with a token is rejected with 401', async () => {
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Session has expired, please log in again' } },
          { status: 401 },
        ),
      ),
    );
    const { api, onUnauthorized } = setup('expired-token');

    await expect(api.get('/vehicles')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledWith('Session has expired, please log in again');
  });

  it('does not call onUnauthorized for a 401 on a request sent without a token (wrong password)', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
          { status: 401 },
        ),
      ),
    );
    const { api, onUnauthorized } = setup(null);

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
