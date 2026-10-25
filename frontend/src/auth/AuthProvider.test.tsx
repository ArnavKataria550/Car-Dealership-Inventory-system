import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/client';
import { server } from '../test/msw-server';
import { tokenExpiringIn } from '../test/tokens';
import { AuthProvider } from './AuthProvider';
import { SESSION_EXPIRED_MESSAGE, useAuth } from './auth-context';
import { loadSession, saveSession } from './session';
import type { User } from './types';

const user: User = {
  id: 'user-1',
  name: 'Arnav Kataria',
  email: 'arnav@example.com',
  role: 'USER',
  createdAt: '2026-10-25T10:00:00.000Z',
};

const renderAuth = () => renderHook(() => useAuth(), { wrapper: AuthProvider });

/** Fake POST /api/auth/login that accepts one password and records what it received. */
function mockLogin(response: { token: string; user: User }, password = 'supersecret') {
  const received: unknown[] = [];
  server.use(
    http.post('/api/auth/login', async ({ request }) => {
      const body = (await request.json()) as { password: string };
      received.push(body);
      return body.password === password
        ? HttpResponse.json(response)
        : HttpResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
            { status: 401 },
          );
    }),
  );
  return received;
}

describe('AuthProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts logged out when nothing is stored', () => {
    const { result } = renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('restores a saved, unexpired session on load', () => {
    saveSession(tokenExpiringIn(3600), user);

    const { result } = renderAuth();

    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('login stores the session and exposes the user', async () => {
    const token = tokenExpiringIn(3600);
    const received = mockLogin({ token, user });
    const { result } = renderAuth();

    await act(() => result.current.login('arnav@example.com', 'supersecret'));

    expect(received).toEqual([{ email: 'arnav@example.com', password: 'supersecret' }]);
    expect(result.current.user).toEqual(user);
    expect(loadSession()?.token).toBe(token);
  });

  it('isAdmin is true for an ADMIN user', async () => {
    const admin = { ...user, role: 'ADMIN' as const };
    mockLogin({ token: tokenExpiringIn(3600, admin.id, 'ADMIN'), user: admin });
    const { result } = renderAuth();

    await act(() => result.current.login(admin.email, 'supersecret'));

    expect(result.current.isAdmin).toBe(true);
  });

  it('a failed login rejects with the API error and stays logged out', async () => {
    mockLogin({ token: tokenExpiringIn(3600), user });
    const { result } = renderAuth();

    const error = await act(() =>
      result.current.login('arnav@example.com', 'wrong-password').catch((e: unknown) => e),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('Invalid email or password');
    expect(result.current.user).toBeNull();
    expect(loadSession()).toBeNull();
  });

  it('register creates the account and then logs in automatically', async () => {
    let registered: unknown;
    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        registered = await request.json();
        return HttpResponse.json({ user }, { status: 201 });
      }),
    );
    mockLogin({ token: tokenExpiringIn(3600), user });
    const { result } = renderAuth();

    await act(() => result.current.register('Arnav Kataria', 'arnav@example.com', 'supersecret'));

    expect(registered).toEqual({
      name: 'Arnav Kataria',
      email: 'arnav@example.com',
      password: 'supersecret',
    });
    expect(result.current.user).toEqual(user);
  });

  it('logout clears the user and the stored session', () => {
    saveSession(tokenExpiringIn(3600), user);
    const { result } = renderAuth();

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(loadSession()).toBeNull();
    expect(result.current.sessionMessage).toBeNull();
  });

  it('logs out automatically when the token expires, with a message', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    saveSession(tokenExpiringIn(60), user);
    const { result } = renderAuth();
    expect(result.current.isAuthenticated).toBe(true);

    act(() => vi.advanceTimersByTime(60_000));

    expect(result.current.user).toBeNull();
    expect(result.current.sessionMessage).toBe(SESSION_EXPIRED_MESSAGE);
    expect(loadSession()).toBeNull();
  });

  it('logs out when the server rejects the token, showing its message', async () => {
    saveSession(tokenExpiringIn(3600), user);
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Session has expired, please log in again' } },
          { status: 401 },
        ),
      ),
    );
    const { result } = renderAuth();

    await act(() => result.current.api.get('/vehicles').catch(() => undefined));

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.sessionMessage).toBe('Session has expired, please log in again');
  });

  it('the shared api client sends the current token', async () => {
    const token = tokenExpiringIn(3600);
    saveSession(token, user);
    let authorization: string | null = null;
    server.use(
      http.get('/api/vehicles', ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ vehicles: [] });
      }),
    );
    const { result } = renderAuth();

    await act(() => result.current.api.get('/vehicles'));

    expect(authorization).toBe(`Bearer ${token}`);
  });

  it('useAuth throws a clear error outside AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});
