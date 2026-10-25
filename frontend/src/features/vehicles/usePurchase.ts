import { useCallback, useState } from 'react';

import { ApiError } from '../../api/client';
import { purchaseVehicle, type Vehicle } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';
import { useToast } from '../../components/toast/toast-context';
import { vehicleTitle } from './vehicle-format';

interface UsePurchaseOptions {
  /** Called with the vehicle as returned by the API after a successful purchase. */
  onPurchased: (vehicle: Vehicle) => void;
  /** Called when the listing changed under us (sold out or deleted) and should be reloaded. */
  onStale: () => void;
}

/** One-click purchase of a single unit, with per-vehicle progress and toast feedback. */
export function usePurchase({ onPurchased, onStale }: UsePurchaseOptions) {
  const { api } = useAuth();
  const { showToast } = useToast();
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  const purchase = useCallback(
    async (vehicle: Vehicle) => {
      setPendingIds((ids) => new Set(ids).add(vehicle.id));
      try {
        const updated = await purchaseVehicle(api, vehicle.id);
        onPurchased(updated);
        showToast({ message: `You bought a ${vehicleTitle(updated)}` });
      } catch (error) {
        showToast({
          tone: 'error',
          message: error instanceof ApiError ? error.message : 'Something went wrong.',
        });
        // 409: someone bought the last unit first. 404: the listing was removed.
        if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
          onStale();
        }
      } finally {
        setPendingIds((ids) => {
          const next = new Set(ids);
          next.delete(vehicle.id);
          return next;
        });
      }
    },
    [api, showToast, onPurchased, onStale],
  );

  return { purchase, isPurchasing: (id: string) => pendingIds.has(id) };
}
