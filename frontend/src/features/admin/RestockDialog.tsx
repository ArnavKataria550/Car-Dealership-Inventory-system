import { useState, type FormEvent } from 'react';

import { ApiError } from '../../api/client';
import { restockVehicle, type Vehicle } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';
import { useToast } from '../../components/toast/toast-context';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { vehicleTitle } from '../vehicles/vehicle-format';

/** Same cap as the API: an admin may add at most this many units per restock. */
export const MAX_RESTOCK_UNITS = 100;

interface RestockDialogProps {
  /** The vehicle to restock; the dialog is closed while this is null. */
  vehicle: Vehicle | null;
  onClose: () => void;
  /** Receives the updated vehicle; the dialog has already shown a confirmation toast. */
  onRestocked: (vehicle: Vehicle) => void;
}

export function RestockDialog({ vehicle, onClose, onRestocked }: RestockDialogProps) {
  return (
    <Modal
      open={vehicle !== null}
      onClose={onClose}
      title={vehicle ? `Restock ${vehicleTitle(vehicle)}` : ''}
      description={vehicle ? `Currently ${vehicle.quantity} in stock.` : undefined}
    >
      {vehicle && <RestockForm key={vehicle.id} vehicle={vehicle} onRestocked={onRestocked} />}
    </Modal>
  );
}

function RestockForm({
  vehicle,
  onRestocked,
}: {
  vehicle: Vehicle;
  onRestocked: (vehicle: Vehicle) => void;
}) {
  const { api } = useAuth();
  const { showToast } = useToast();
  const [units, setUnits] = useState('1');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const quantity = Number(units.trim());
    if (!/^\d+$/.test(units.trim()) || quantity < 1 || quantity > MAX_RESTOCK_UNITS) {
      setFieldError(`Enter a whole number from 1 to ${MAX_RESTOCK_UNITS}`);
      return;
    }
    setFieldError(undefined);

    setSaving(true);
    try {
      const updated = await restockVehicle(api, vehicle.id, quantity);
      onRestocked(updated);
      showToast({
        message: `Restocked ${vehicleTitle(updated)}: now ${updated.quantity} in stock`,
      });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}
      <TextField
        label="Units to add"
        inputMode="numeric"
        value={units}
        onChange={(event) => setUnits(event.target.value)}
        error={fieldError}
        hint={`Up to ${MAX_RESTOCK_UNITS} units at a time.`}
      />
      <div className="flex justify-end">
        <Button type="submit" variant="dark" loading={saving} loadingText="Adding…">
          Add stock
        </Button>
      </div>
    </form>
  );
}
