import type { Category } from '../vehicles/vehicle.types.js';

/** A purchase as returned by the API. Prices are integer cents. */
export interface PurchaseView {
  id: string;
  /** Null when the listing has since been deleted; `vehicle` still describes the car. */
  vehicleId: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  purchasedAt: Date;
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
