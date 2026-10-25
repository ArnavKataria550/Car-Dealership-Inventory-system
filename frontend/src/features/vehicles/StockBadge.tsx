import { LOW_STOCK_THRESHOLD } from './vehicle-format';

/** "4 in stock" (neutral), "Only 2 left" (amber) or "Sold out" (ink). */
export function StockBadge({ quantity, className = '' }: { quantity: number; className?: string }) {
  const [text, style] =
    quantity === 0
      ? ['Sold out', 'bg-ink-950 text-paper']
      : quantity <= LOW_STOCK_THRESHOLD
        ? [`Only ${quantity} left`, 'bg-accent text-ink-950']
        : [`${quantity} in stock`, 'bg-white/90 text-ink-900 ring-1 ring-ink-950/10 backdrop-blur'];

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-sm ${style} ${className}`}
    >
      {text}
    </span>
  );
}
