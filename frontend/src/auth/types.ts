export const ROLES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

/** The logged-in user as returned by the API (never includes the password hash). */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

/** A stored login: the bearer token, its owner, and when it stops being valid. */
export interface Session {
  token: string;
  user: User;
  /** Token expiry as a Unix timestamp in milliseconds. */
  expiresAt: number;
}
