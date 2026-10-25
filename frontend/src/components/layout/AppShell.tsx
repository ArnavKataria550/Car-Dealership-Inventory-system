import { Link, NavLink, Outlet } from 'react-router';

import { useAuth } from '../../auth/auth-context';
import { Logo } from '../brand/Logo';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative py-1 text-sm font-medium transition-colors hover:text-paper
   after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:transition
   ${isActive ? 'text-paper after:bg-accent' : 'text-stone-400 after:bg-transparent'}`;

/** Layout for signed-in pages: black top bar with navigation, greeting and logout. */
export function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/95 text-paper backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6">
          <Link to="/" aria-label="Drivewright home" className="rounded-lg">
            <Logo compactOnMobile />
          </Link>

          <nav aria-label="Main" className="flex items-center gap-4 sm:gap-6">
            <NavLink to="/" end className={navLinkClass}>
              Inventory
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-sm text-stone-300 sm:inline">Hi, {firstName}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm font-medium whitespace-nowrap transition hover:border-accent hover:text-accent sm:px-4"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
