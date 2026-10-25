import { useId } from 'react';
import { Link } from 'react-router';

import type { Purchase } from '../api/purchases';
import { CATEGORY_LABELS } from '../api/vehicles';
import { useAuth } from '../auth/auth-context';
import { ButtonLink } from '../components/ui/Button';
import { LoadError } from '../components/ui/LoadError';
import { usePurchases } from '../features/purchases/usePurchases';
import { vehicleTitle } from '../features/vehicles/vehicle-format';
import { VehiclePhoto } from '../features/vehicles/VehiclePhoto';
import { formatPrice } from '../lib/money';

const PURCHASE_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** Order history: a customer's own purchases, or every sale for admins. */
export function PurchasesPage() {
  const { isAdmin } = useAuth();
  const { status, purchases, error, retry } = usePurchases();
  const total = purchases.reduce((sum, purchase) => sum + purchase.totalCents, 0);

  return (
    <>
      <section className="bg-ink-950 text-paper">
        <div className="mx-auto max-w-7xl px-6 pt-10 pb-14">
          <p className="text-sm font-semibold tracking-widest text-accent uppercase">
            Order history
          </p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
            {isAdmin ? 'All purchases' : 'My purchases'}
          </h1>
          <p className="mt-3 text-stone-400" aria-live="polite">
            {status === 'success' &&
              purchases.length > 0 &&
              `${purchases.length} ${purchases.length === 1 ? 'purchase' : 'purchases'} · ${formatPrice(total)} ${isAdmin ? 'in sales' : 'spent'}`}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        {status === 'loading' && (
          <p role="status" className="py-16 text-center text-stone-500">
            Loading purchases…
          </p>
        )}
        {status === 'error' && (
          <LoadError
            what={isAdmin ? 'the purchases' : 'your purchases'}
            message={error}
            onRetry={retry}
          />
        )}
        {status === 'success' && purchases.length === 0 && <NoPurchases />}

        {status === 'success' && purchases.length > 0 && (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <PurchaseItem key={purchase.id} purchase={purchase} showBuyer={isAdmin} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function PurchaseItem({ purchase, showBuyer }: { purchase: Purchase; showBuyer: boolean }) {
  const titleId = useId();
  const title = vehicleTitle(purchase.vehicle);

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink-950/5 sm:flex-row sm:items-center"
    >
      <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-stone-200 sm:w-40">
        <VehiclePhoto src={purchase.vehicle.imageUrl} title={title} />
      </div>

      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="text-lg leading-snug font-semibold">
          {purchase.vehicleId ? (
            <Link
              to={`/vehicles/${encodeURIComponent(purchase.vehicleId)}`}
              className="underline-offset-4 hover:underline"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="mt-0.5 text-sm text-stone-500">
          {purchase.vehicle.color} · {CATEGORY_LABELS[purchase.vehicle.category]}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <time dateTime={purchase.purchasedAt} className="text-stone-600">
            {PURCHASE_DATE.format(new Date(purchase.purchasedAt))}
          </time>
          {!purchase.vehicleId && (
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
              No longer listed
            </span>
          )}
          {showBuyer && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-accent-ink">
              Bought by {purchase.buyer.name}
            </span>
          )}
        </div>
      </div>

      <div className="text-left sm:text-right">
        <p className="text-sm text-stone-500">
          {purchase.quantity} × {formatPrice(purchase.unitPriceCents)}
        </p>
        <p className="font-display text-2xl font-semibold tracking-tight">
          {formatPrice(purchase.totalCents)}
        </p>
      </div>
    </article>
  );
}

function NoPurchases() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">No purchases yet</h2>
      <p className="mt-2 text-stone-600">When you buy a car, it will show up here.</p>
      <ButtonLink to="/" variant="dark" className="mt-6">
        Browse the inventory
      </ButtonLink>
    </div>
  );
}
