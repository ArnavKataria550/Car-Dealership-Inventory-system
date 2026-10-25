import { useState } from 'react';

import { ApiError } from '../../api/client';
import { purchaseVehicle, type Vehicle } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';
import { useToast } from '../../components/toast/toast-context';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatPrice } from '../../lib/money';
import { vehicleTitle } from './vehicle-format';
import { VehiclePhoto } from './VehiclePhoto';

interface ConfirmPurchaseDialogProps {
  /** The vehicle to buy; the dialog is closed while this is null. */
  vehicle: Vehicle | null;
  onClose: () => void;
  /** Receives the vehicle with its updated stock; a toast has already been shown. */
  onPurchased: (vehicle: Vehicle) => void;
  /** Called when the listing changed meanwhile (sold out or deleted) and should be reloaded. */
  onStale: () => void;
}

/** "Are you sure?" step before buying one unit. Nothing is bought until Confirm is pressed. */
export function ConfirmPurchaseDialog({
  vehicle,
  onClose,
  onPurchased,
  onStale,
}: ConfirmPurchaseDialogProps) {
  return (
    <Modal open={vehicle !== null} onClose={onClose} title="Confirm purchase">
      {vehicle && (
        <Confirmation
          key={vehicle.id}
          vehicle={vehicle}
          onCancel={onClose}
          onPurchased={onPurchased}
          onStale={onStale}
        />
      )}
    </Modal>
  );
}

function Confirmation({
  vehicle,
  onCancel,
  onPurchased,
  onStale,
}: {
  vehicle: Vehicle;
  onCancel: () => void;
  onPurchased: (vehicle: Vehicle) => void;
  onStale: () => void;
}) {
  const { api } = useAuth();
  const { showToast } = useToast();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = vehicleTitle(vehicle);

  async function confirm() {
    setBuying(true);
    setError(null);
    try {
      const updated = await purchaseVehicle(api, vehicle.id);
      onPurchased(updated);
      showToast({ message: `You bought a ${vehicleTitle(updated)}` });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong.');
      setBuying(false);
      // 409: someone bought the last unit first. 404: the listing was removed.
      if (caught instanceof ApiError && (caught.status === 409 || caught.status === 404)) {
        onStale();
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-3 ring-1 ring-ink-950/5">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-200">
          <VehiclePhoto src={vehicle.imageUrl} title={title} />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="font-display text-lg font-semibold">{formatPrice(vehicle.priceCents)}</p>
        </div>
      </div>

      <p className="text-stone-700">
        You're about to buy one {title} for {formatPrice(vehicle.priceCents)}.
      </p>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button loading={buying} loadingText="Buying…" onClick={confirm}>
          Confirm purchase
        </Button>
      </div>
    </div>
  );
}
