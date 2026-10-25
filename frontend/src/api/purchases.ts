import type { ApiClient } from './client';
import type { Category } from './vehicles';

/** A recorded purchase as returned by the API. Prices are integer cents. */
export interface Purchase {
  id: string;
  /** Null when the listing has since been deleted; `vehicle` still describes the car. */
  vehicleId: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  purchasedAt: string;
  /** The car as it was when bought. */
  vehicle: {
    make: string;
    model: string;
    category: Category;
    year: number;
    color: string;
    imageUrl: string;
  };
  buyer: { id: string; name: string; email: string };
}

/** The caller's purchases (every sale, for admins), newest first. */
export async function fetchPurchases(api: ApiClient): Promise<Purchase[]> {
  return (await api.get<{ purchases: Purchase[] }>('/purchases')).purchases;
}
