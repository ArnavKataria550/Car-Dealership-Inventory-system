import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { CATEGORY_LABELS, type Vehicle } from '../api/vehicles';
import { useAuth } from '../auth/auth-context';
import { useToast } from '../components/toast/toast-context';
import { Button, ButtonLink } from '../components/ui/Button';
import { LoadError } from '../components/ui/LoadError';
import { RestockDialog } from '../features/admin/RestockDialog';
import { VehicleFormDialog } from '../features/admin/VehicleFormDialog';
import { ConfirmPurchaseDialog } from '../features/vehicles/ConfirmPurchaseDialog';
import { StockBadge } from '../features/vehicles/StockBadge';
import { useVehicle } from '../features/vehicles/useVehicle';
import { vehicleTitle } from '../features/vehicles/vehicle-format';
import { VehiclePhoto } from '../features/vehicles/VehiclePhoto';
import { formatPrice } from '../lib/money';

/** One listing in full, where customers buy (after confirming) and admins can edit or restock. */
export function VehicleDetailsPage() {
  const { id = '' } = useParams();
  const { status, vehicle, error, reload, replace } = useVehicle(id);

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-ink-950"
      >
        <span aria-hidden="true">←</span> Back to inventory
      </Link>

      <div className="mt-6">
        {status === 'loading' && !vehicle && (
          <p role="status" className="py-24 text-center text-stone-500">
            Loading vehicle…
          </p>
        )}
        {status === 'error' && <LoadError what="this vehicle" message={error} onRetry={reload} />}
        {status === 'not-found' && <VehicleNotFound />}
        {vehicle && status !== 'not-found' && (
          <VehicleDetails vehicle={vehicle} onChanged={replace} onStale={reload} />
        )}
      </div>
    </section>
  );
}

function VehicleDetails({
  vehicle,
  onChanged,
  onStale,
}: {
  vehicle: Vehicle;
  onChanged: (vehicle: Vehicle) => void;
  onStale: () => void;
}) {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const title = vehicleTitle(vehicle);
  const soldOut = vehicle.quantity === 0;

  const specifications = [
    ['Make', vehicle.make],
    ['Model', vehicle.model],
    ['Year', String(vehicle.year)],
    ['Category', CATEGORY_LABELS[vehicle.category]],
    ['Colour', vehicle.color],
  ];

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-stone-200 shadow-card ring-1 ring-ink-950/5">
          <VehiclePhoto src={vehicle.imageUrl} title={title} dimmed={soldOut} />
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-semibold tracking-widest text-accent-ink uppercase">
            {CATEGORY_LABELS[vehicle.category]}
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold sm:text-4xl">{title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="font-display text-4xl font-semibold tracking-tight">
              {formatPrice(vehicle.priceCents)}
            </p>
            <StockBadge quantity={vehicle.quantity} />
          </div>

          <ul
            aria-label="Specifications"
            className="mt-8 grid grid-cols-2 gap-3 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5"
          >
            {specifications.map(([label, value]) => (
              <li key={label}>
                <span className="block text-xs tracking-wide text-stone-500 uppercase">
                  {label}
                </span>
                <span className="mt-0.5 block font-semibold">{value}</span>
              </li>
            ))}
          </ul>

          <Button
            className="mt-8 w-full py-4 text-base"
            disabled={soldOut}
            onClick={() => setConfirming(true)}
          >
            {soldOut ? 'Sold out' : 'Purchase'}
          </Button>
          <p className="mt-3 text-center text-xs text-stone-500">
            {soldOut
              ? 'This car is out of stock right now. Check back soon.'
              : "You'll be asked to confirm before anything is charged."}
          </p>

          {isAdmin && (
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-200 pt-6">
              <Button
                variant="outline"
                aria-label={`Edit ${title}`}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                aria-label={`Restock ${title}`}
                onClick={() => setRestocking(true)}
              >
                Restock
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmPurchaseDialog
        vehicle={confirming ? vehicle : null}
        onClose={() => setConfirming(false)}
        onPurchased={(updated) => {
          onChanged(updated);
          setConfirming(false);
        }}
        onStale={onStale}
      />

      {isAdmin && (
        <>
          <VehicleFormDialog
            target={editing ? vehicle : null}
            onClose={() => setEditing(false)}
            onSaved={(saved) => {
              onChanged(saved);
              setEditing(false);
              showToast({ message: `Saved ${vehicleTitle(saved)}` });
            }}
          />
          <RestockDialog
            vehicle={restocking ? vehicle : null}
            onClose={() => setRestocking(false)}
            onRestocked={(updated) => {
              onChanged(updated);
              setRestocking(false);
            }}
          />
        </>
      )}
    </>
  );
}

function VehicleNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <h1 className="text-3xl font-semibold">Vehicle not found</h1>
      <p className="mt-3 text-stone-600">
        This listing may have been sold out and removed, or the link is wrong.
      </p>
      <ButtonLink to="/" variant="dark" className="mt-8">
        Browse the inventory
      </ButtonLink>
    </div>
  );
}
