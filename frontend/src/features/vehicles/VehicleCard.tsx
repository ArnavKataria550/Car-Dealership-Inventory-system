import { useId, useState } from 'react';

import { CATEGORY_LABELS, type Vehicle } from '../../api/vehicles';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../lib/money';
import { LOW_STOCK_THRESHOLD, vehicleTitle } from './vehicle-format';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase: (vehicle: Vehicle) => void;
  /** True while this card's purchase request is in flight. */
  purchasing?: boolean;
  isAdmin?: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onRestock?: (vehicle: Vehicle) => void;
}

/** A storefront listing: photo, key facts, price, stock and a one-click Purchase button. */
export function VehicleCard({
  vehicle,
  onPurchase,
  purchasing = false,
  isAdmin = false,
  onEdit,
  onRestock,
}: VehicleCardProps) {
  const titleId = useId();
  const title = vehicleTitle(vehicle);
  const soldOut = vehicle.quantity === 0;

  return (
    <article
      aria-labelledby={titleId}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
        <VehiclePhoto src={vehicle.imageUrl} title={title} dimmed={soldOut} />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink-900 shadow-sm backdrop-blur">
          {CATEGORY_LABELS[vehicle.category]}
        </span>
        <StockBadge quantity={vehicle.quantity} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 id={titleId} className="text-lg leading-snug font-semibold">
          {title}
        </h3>
        <p className="mt-1 text-sm text-stone-500">{vehicle.color}</p>

        <p className="mt-auto pt-5 font-display text-2xl font-semibold tracking-tight">
          {formatPrice(vehicle.priceCents)}
        </p>

        <Button
          className="mt-4 w-full"
          disabled={soldOut}
          loading={purchasing}
          loadingText="Buying…"
          onClick={() => onPurchase(vehicle)}
        >
          {soldOut ? 'Sold out' : 'Purchase'}
        </Button>

        {isAdmin && (
          <div className="mt-3 grid grid-cols-2 gap-2">
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

function VehiclePhoto({ src, title, dimmed }: { src: string; title: string; dimmed: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-200 to-stone-300 text-stone-500">
        <svg
          viewBox="0 0 24 24"
          className="size-10"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z"
          />
        </svg>
        <span className="text-xs font-medium">Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`size-full object-cover transition duration-500 group-hover:scale-105 ${
        dimmed ? 'opacity-60 grayscale-[60%]' : ''
      }`}
    />
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  const [text, style] =
    quantity === 0
      ? ['Sold out', 'bg-ink-950 text-paper']
      : quantity <= LOW_STOCK_THRESHOLD
        ? [`Only ${quantity} left`, 'bg-accent text-ink-950']
        : [`${quantity} in stock`, 'bg-white/90 text-ink-900 backdrop-blur'];

  return (
    <span
      className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${style}`}
    >
      {text}
    </span>
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
      className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-ink-800 transition hover:border-ink-950 hover:bg-ink-950 hover:text-paper"
    >
      {children}
    </button>
  );
}
