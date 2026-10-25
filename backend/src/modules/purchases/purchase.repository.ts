import type { PurchaseView } from './purchase.types.js';

/** Read access to the order history, newest first. */
export interface PurchaseRepository {
  listByBuyer(buyerId: string): Promise<PurchaseView[]>;
  listAll(): Promise<PurchaseView[]>;
}
