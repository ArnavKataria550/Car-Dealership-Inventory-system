import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../auth/auth-context';
import { NoAccessPage } from '../pages/NoAccessPage';

/** Location state passed to /login so the user can be sent back afterwards. */
export interface LoginRedirectState {
  from?: { pathname: string };
}

/** Renders child routes only for logged-in users; others go to /login. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const state: LoginRedirectState = { from: { pathname: location.pathname } };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/** Renders child routes only for admins. Must be nested inside ProtectedRoute. */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <NoAccessPage />;
}

/**
 * For /login and /register: a logged-in user has no reason to be there. This
 * is also what moves the user on after logging in: back to the page that
 * sent them to /login, or to the inventory.
 */
export function GuestOnlyRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as LoginRedirectState | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}
