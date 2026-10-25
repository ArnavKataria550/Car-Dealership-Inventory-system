import { ROLES, type Session, type User } from './types';

export const SESSION_STORAGE_KEY = 'drivewright.session';

/** Persists the login so a page refresh keeps the user signed in (until the token expires). */
export function saveSession(token: string, user: User): Session {
  const expiresAt = readTokenExpiry(token);
  if (expiresAt === null) {
    throw new Error('Cannot save a session: the token has no expiry');
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user }));
  return { token, user, expiresAt };
}

/**
 * Restores the saved login. Anything expired, malformed or tampered with is
 * removed and treated as logged out; it is never trusted as a session.
 */
export function loadSession(now = Date.now()): Session | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === null) return null;

  const session = parseSession(raw);
  if (!session || session.expiresAt <= now) {
    clearSession();
    return null;
  }
  return session;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function parseSession(raw: string): Session | null {
  try {
    const { token, user } = JSON.parse(raw) as { token?: unknown; user?: unknown };
    if (typeof token !== 'string' || !isUser(user)) return null;

    const expiresAt = readTokenExpiry(token);
    return expiresAt === null ? null : { token, user, expiresAt };
  } catch {
    return null;
  }
}

/**
 * Reads the `exp` claim (seconds) from a JWT and returns it in milliseconds.
 * The signature is not checked here; the server verifies every request.
 */
function readTokenExpiry(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64)) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    ROLES.includes(user.role as User['role'])
  );
}
