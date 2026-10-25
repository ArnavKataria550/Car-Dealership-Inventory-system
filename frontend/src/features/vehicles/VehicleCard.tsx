import { useId } from 'react';
import { Link } from 'react-router';

import { CATEGORY_LABELS, type Vehicle } from '../../api/vehicles';
import { formatPrice } from '../../lib/money';
import { StockBadge } from './StockBadge';
import { vehicleTitle } from './vehicle-format';
import { VehiclePhoto } from './VehiclePhoto';

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin?: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onRestock?: (vehicle: Vehicle) => void;
}

/**
 * A storefront listing: photo, key facts, price and stock. The whole card opens
 * the details page (where the car can be bought): the title link is stretched
 * over the card, and admin buttons sit above it, since a button may not be
 * nested inside a link.
 */
export function VehicleCard({ vehicle, isAdmin = false, onEdit, onRestock }: VehicleCardProps) {
  const titleId = useId();
  const title = vehicleTitle(vehicle);

  return (
    <article
      aria-labelledby={titleId}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-950/5 transition duration-300 focus-within:ring-2 focus-within:ring-accent hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
        <VehiclePhoto src={vehicle.imageUrl} title={title} dimmed={vehicle.quantity === 0} />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink-900 shadow-sm backdrop-blur">
          {CATEGORY_LABELS[vehicle.category]}
        </span>
        <StockBadge quantity={vehicle.quantity} className="absolute top-3 right-3" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 id={titleId} className="text-lg leading-snug font-semibold">
          <Link
            to={`/vehicles/${encodeURIComponent(vehicle.id)}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-stone-500">{vehicle.color}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="font-display text-2xl font-semibold tracking-tight">
            {formatPrice(vehicle.priceCents)}
          </p>
          <span
            aria-hidden="true"
            className="flex items-center gap-1 pb-1 text-sm font-semibold text-ink-800 transition group-hover:text-accent-ink"
          >
            <span>View details</span>
            <span className="transition group-hover:translate-x-0.5">→</span>
          </span>
        </div>

        {isAdmin && (
          // Raised above the stretched link so these stay clickable.
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
            <AdminAction label={`Edit ${title}`} onClick={() => onEdit?.(vehicle)}>
              Edit
            </AdminAction>
            <AdminAction label={`Restock ${title}`} onClick={() => onRestock?.(vehicle)}>
              Restock
            </AdminAction>
          </div>
        )}
      </div>
    </article>
  );
}

function AdminAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-ink-800 transition hover:border-ink-950 hover:bg-ink-950 hover:text-paper"
    >
      {children}
    </button>
  );
}
