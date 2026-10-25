export type Role = 'USER' | 'ADMIN';

/** A user as it may be exposed over the API: never includes the password hash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Returned by a successful login: a bearer token plus the user it belongs to. */
export interface AuthResult {
  token: string;
  user: PublicUser;
}

export interface AuthTokenOptions {
  jwtSecret: string;
  /** Lifetime in `ms`-style notation, e.g. "1h". */
  jwtExpiresIn: string;
}
