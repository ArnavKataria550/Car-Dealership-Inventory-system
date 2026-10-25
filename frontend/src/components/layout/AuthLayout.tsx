import type { ReactNode } from 'react';

import { BRAND_TAGLINE } from '../../config/brand';
import { Logo } from '../brand/Logo';

// Same freely licensed photo as the seeded Mustang listing (see docs/IMAGE_CREDITS.md).
const HERO_IMAGE =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/2018_Ford_Mustang_Convertible_%28SIAM_2018%29.jpg/1280px-2018_Ford_Mustang_Convertible_%28SIAM_2018%29.jpg';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Split screen: a full-height car photo on black beside the form. The photo hides on small screens. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 size-full scale-105 object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-ink-950/20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-paper">
          <Logo />
          <div className="max-w-md">
            <p className="font-display text-4xl leading-tight font-semibold">{BRAND_TAGLINE}</p>
            <p className="mt-4 text-stone-300">
              Hand-picked sedans, SUVs, trucks and EVs. Real stock, transparent prices, ready when
              you are.
            </p>
          </div>
          <p className="text-xs text-stone-400">
            Photo: 2018 Ford Mustang Convertible by Bull-Doser, public domain, via Wikimedia Commons
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 mb-8 text-stone-600">{subtitle}</p>
          {children}
          <p className="mt-8 text-center text-sm text-stone-600">{footer}</p>
        </div>
      </main>
    </div>
  );
}
