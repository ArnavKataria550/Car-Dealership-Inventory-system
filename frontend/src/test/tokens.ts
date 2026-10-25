/**
 * Builds an unsigned JWT-shaped string for tests. The frontend never verifies
 * signatures (the server does); it only reads the `exp` claim.
 */
export function makeToken(payload: Record<string, unknown>): string {
  const encode = (part: object) => btoa(JSON.stringify(part)).replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.test-signature`;
}

/** A token for user `id` expiring `secondsFromNow` seconds from now (negative = already expired). */
export function tokenExpiringIn(secondsFromNow: number, id = 'user-1', role = 'USER'): string {
  return makeToken({ sub: id, role, exp: Math.floor(Date.now() / 1000) + secondsFromNow });
}
