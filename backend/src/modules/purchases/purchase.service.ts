import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { PurchaseRepository } from './purchase.repository.js';
import type { PurchaseView } from './purchase.types.js';

/** Who may see which orders: customers their own, admins every sale. */
export class PurchaseService {
  constructor(private readonly purchases: PurchaseRepository) {}

  listFor(user: AuthenticatedUser): Promise<PurchaseView[]> {
    return user.role === 'ADMIN' ? this.purchases.listAll() : this.purchases.listByBuyer(user.id);
  }
}
