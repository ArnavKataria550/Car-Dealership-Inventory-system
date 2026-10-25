import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createApiClient } from '../api/client';
import { AuthContext, SESSION_EXPIRED_MESSAGE, type AuthContextValue } from './auth-context';
import { clearSession, loadSession, saveSession } from './session';
import type { Session, User } from './types';

interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Owns the login state for the whole app: restores a saved session, exposes
 * login/register/logout, and logs the user out when the token expires or the
 * server rejects it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const logout = useCallback((message?: string) => {
    clearSession();
    setSession(null);
    setSessionMessage(message ?? null);
  }, []);

  const api = useMemo(
    () =>
      createApiClient({
        // Storage is the source of truth: login writes it before any request is
        // made, logout clears it immediately, and an expired token is never sent.
        getToken: () => loadSession()?.token ?? null,
        onUnauthorized: (message) => logout(message),
      }),
    [logout],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user } = await api.post<LoginResponse>('/auth/login', { email, password });
      const saved = saveSession(token, user);
      setSession(saved);
      setSessionMessage(null);
      return user;
    },
    [api],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await api.post('/auth/register', { name, email, password });
      return login(email, password);
    },
    [api, login],
  );

  // Log out the moment the token expires, instead of waiting for a failed request.
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => logout(SESSION_EXPIRED_MESSAGE),
      Math.max(session.expiresAt - Date.now(), 0),
    );
    return () => clearTimeout(timer);
  }, [session, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isAdmin: session?.user.role === 'ADMIN',
      sessionMessage,
      login,
      register,
      logout,
      clearSessionMessage: () => setSessionMessage(null),
      api,
    }),
    [session, sessionMessage, login, register, logout, api],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
