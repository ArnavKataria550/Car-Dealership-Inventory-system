import { useMemo, useState } from 'react';

import type { Vehicle, VehicleFilters } from '../api/vehicles';
import { useAuth } from '../auth/auth-context';
import { useToast } from '../components/toast/toast-context';
import { Button } from '../components/ui/Button';
import { LoadError } from '../components/ui/LoadError';
import { RestockDialog } from '../features/admin/RestockDialog';
import { VehicleFormDialog } from '../features/admin/VehicleFormDialog';
import { BRAND_NAME } from '../config/brand';
import { SearchFilters } from '../features/vehicles/SearchFilters';
import { useInventoryFilters } from '../features/vehicles/useInventoryFilters';
import { usePurchase } from '../features/vehicles/usePurchase';
import { useVehicles } from '../features/vehicles/useVehicles';
import { VehicleCard } from '../features/vehicles/VehicleCard';
import { vehicleTitle } from '../features/vehicles/vehicle-format';
import { useDebouncedValue } from '../lib/useDebouncedValue';

/** Wait this long after the last keystroke before searching. */
const SEARCH_DELAY_MS = 300;

/** The storefront: search panel plus every matching vehicle as a grid of cards. */
export function InventoryPage() {
  const { isAdmin } = useAuth();
  const { values, errors, filters, isFiltering, setValue, clear } = useInventoryFilters();

  // Debounce a string so identical filters never trigger a new request.
  const debouncedKey = useDebouncedValue(JSON.stringify(filters), SEARCH_DELAY_MS);
  const activeFilters = useMemo(() => JSON.parse(debouncedKey) as VehicleFilters, [debouncedKey]);

  const { status, vehicles, error, retry, replaceVehicle } = useVehicles(activeFilters);
  const { purchase, isPurchasing } = usePurchase({ onPurchased: replaceVehicle, onStale: retry });
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [restocking, setRestocking] = useState<Vehicle | null>(null);
  const inStock = vehicles.filter((vehicle) => vehicle.quantity > 0).length;

  return (
    <>
      <section className="bg-ink-950 text-paper">
        <div className="mx-auto max-w-7xl px-6 pt-10 pb-20">
          <p className="text-sm font-semibold tracking-widest text-accent uppercase">
            {BRAND_NAME} inventory
          </p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Find your next car</h1>
          <p className="mt-3 text-stone-400" aria-live="polite">
            {status === 'success' && summary(vehicles.length, inStock, isFiltering)}
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-12 max-w-7xl px-6">
        <SearchFilters
          values={values}
          errors={errors}
          isFiltering={isFiltering}
          onChange={setValue}
          onClear={clear}
        />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {status === 'error' && <LoadError what="the inventory" message={error} onRetry={retry} />}
        {status === 'loading' && vehicles.length === 0 && <SkeletonGrid />}
        {status === 'success' && vehicles.length === 0 && (
          <EmptyResults isFiltering={isFiltering} onClear={clear} />
        )}

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
                onEdit={setEditing}
                onRestock={setRestocking}
              />
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <>
          <RestockDialog
            vehicle={restocking}
            onClose={() => setRestocking(null)}
            onRestocked={(updated) => {
              replaceVehicle(updated);
              setRestocking(null);
            }}
          />
          <VehicleFormDialog
            target={editing}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              replaceVehicle(saved);
              setEditing(null);
              showToast({ message: `Saved ${vehicleTitle(saved)}` });
            }}
          />
        </>
      )}
    </>
  );
}

function summary(total: number, inStock: number, isFiltering: boolean): string {
  const noun = isFiltering
    ? total === 1
      ? 'match'
      : 'matches'
    : total === 1
      ? 'vehicle'
      : 'vehicles';
  return `${total} ${noun} · ${inStock} in stock`;
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

function EmptyResults({ isFiltering, onClear }: { isFiltering: boolean; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      {isFiltering ? (
        <>
          <h2 className="text-2xl font-semibold">No cars match your search</h2>
          <p className="mt-2 text-stone-600">Try a different make, model, category or price.</p>
          <Button variant="dark" className="mt-6" onClick={onClear}>
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold">No vehicles yet</h2>
          <p className="mt-2 text-stone-600">New stock is on its way. Check back soon.</p>
        </>
      )}
    </div>
  );
}
