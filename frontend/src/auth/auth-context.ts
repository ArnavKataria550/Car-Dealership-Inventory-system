import { createContext, useContext } from 'react';

import type { ApiClient } from '../api/client';
import type { User } from './types';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** Why the user was logged out (e.g. session expired), shown once on the login page. */
  sessionMessage: string | null;
  login(email: string, password: string): Promise<User>;
  /** Creates the account, then logs in with the same credentials. */
  register(name: string, email: string, password: string): Promise<User>;
  logout(message?: string): void;
  clearSessionMessage(): void;
  /** API client that always sends the current user's token. */
  api: ApiClient;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Access the current login. Must be used inside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
