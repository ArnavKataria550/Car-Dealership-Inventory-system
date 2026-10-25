import { describe, expect, it } from 'vitest';

import { makeToken, tokenExpiringIn } from '../test/tokens';
import { clearSession, loadSession, saveSession, SESSION_STORAGE_KEY } from './session';
import type { User } from './types';

const user: User = {
  id: 'user-1',
  name: 'Arnav Kataria',
  email: 'arnav@example.com',
  role: 'USER',
  createdAt: '2026-10-25T10:00:00.000Z',
};

describe('session storage', () => {
  it('saves a session and loads it back with the expiry taken from the token', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeToken({ sub: user.id, role: 'USER', exp });

    saveSession(token, user);

    expect(loadSession()).toEqual({ token, user, expiresAt: exp * 1000 });
  });

  it('returns null when nothing is stored', () => {
    expect(loadSession()).toBeNull();
  });

  it('discards an expired session and removes it from storage', () => {
    saveSession(tokenExpiringIn(-10), user);

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ['is not JSON', '{not json'],
    ['has no token', JSON.stringify({ user })],
    ['has a token that is not a JWT', JSON.stringify({ token: 'garbage', user })],
    ['has a token without an expiry', JSON.stringify({ token: makeToken({ sub: 'u' }), user })],
    ['has no user', JSON.stringify({ token: tokenExpiringIn(3600) })],
    [
      'has a user with an unknown role',
      JSON.stringify({ token: tokenExpiringIn(3600), user: { ...user, role: 'ROOT' } }),
    ],
  ])('discards stored data that %s', (_case, raw) => {
    localStorage.setItem(SESSION_STORAGE_KEY, raw);

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('refuses to save a token that has no expiry', () => {
    expect(() => saveSession(makeToken({ sub: user.id }), user)).toThrow(/expiry/i);
  });

  it('clearSession removes the stored session', () => {
    saveSession(tokenExpiringIn(3600), user);

    clearSession();

    expect(loadSession()).toBeNull();
  });
});
