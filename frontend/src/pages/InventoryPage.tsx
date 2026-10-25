import type { VehicleFilters } from '../api/vehicles';
import { useAuth } from '../auth/auth-context';
import { Button } from '../components/ui/Button';
import { BRAND_NAME } from '../config/brand';
import { usePurchase } from '../features/vehicles/usePurchase';
import { VehicleCard } from '../features/vehicles/VehicleCard';
import { useVehicles } from '../features/vehicles/useVehicles';

const NO_FILTERS: VehicleFilters = {};

/** The storefront: every vehicle on the lot as a grid of cards. */
export function InventoryPage() {
  const { isAdmin } = useAuth();
  const { status, vehicles, error, retry, replaceVehicle } = useVehicles(NO_FILTERS);
  const { purchase, isPurchasing } = usePurchase({
    onPurchased: replaceVehicle,
    onStale: retry,
  });
  const inStock = vehicles.filter((vehicle) => vehicle.quantity > 0).length;

  return (
    <>
      <section className="bg-ink-950 text-paper">
        <div className="mx-auto max-w-7xl px-6 pt-10 pb-14">
          <p className="text-sm font-semibold tracking-widest text-accent uppercase">
            {BRAND_NAME} inventory
          </p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Find your next car</h1>
          <p className="mt-3 text-stone-400" aria-live="polite">
            {status === 'success' &&
              `${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'} · ${inStock} in stock`}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {status === 'error' && <LoadError message={error} onRetry={retry} />}
        {status === 'loading' && vehicles.length === 0 && <SkeletonGrid />}
        {status === 'success' && vehicles.length === 0 && <EmptyInventory />}

        {vehicles.length > 0 && (
          <div
            className={`grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
              status === 'loading' ? 'opacity-60' : ''
            }`}
          >
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isAdmin={isAdmin}
                purchasing={isPurchasing(vehicle.id)}
                onPurchase={purchase}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function SkeletonGrid() {
  return (
    <div role="status" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <span className="sr-only">Loading vehicles…</span>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-950/5"
        >
          <div className="aspect-[16/10] animate-shimmer bg-stone-200" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-shimmer rounded-full bg-stone-200" />
            <div className="h-4 w-1/3 animate-shimmer rounded-full bg-stone-200" />
            <div className="h-7 w-1/2 animate-shimmer rounded-full bg-stone-200" />
            <div className="h-11 animate-shimmer rounded-xl bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInventory() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">No vehicles yet</h2>
      <p className="mt-2 text-stone-600">New stock is on its way. Check back soon.</p>
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <strong className="font-semibold">We couldn't load the inventory.</strong>{' '}
        {message ?? 'Please try again.'}
      </p>
      <Button variant="dark" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
