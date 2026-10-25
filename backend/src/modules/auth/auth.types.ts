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
