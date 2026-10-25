import { useState } from 'react';

import { ApiError } from '../../api/client';
import { deleteVehicle, type Vehicle } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { vehicleTitle } from '../vehicles/vehicle-format';

interface DeleteVehicleDialogProps {
  /** The vehicle to delete; the dialog is closed while this is null. */
  vehicle: Vehicle | null;
  onClose: () => void;
  onDeleted: (vehicle: Vehicle) => void;
}

/** Confirmation step before permanently deleting a listing. */
export function DeleteVehicleDialog({ vehicle, onClose, onDeleted }: DeleteVehicleDialogProps) {
  return (
    <Modal
      open={vehicle !== null}
      onClose={onClose}
      title={vehicle ? `Delete ${vehicleTitle(vehicle)}?` : ''}
      description="This can't be undone."
    >
      {/* Keyed by vehicle so a new target always starts with a fresh state. */}
      {vehicle && (
        <DeleteConfirmation
          key={vehicle.id}
          vehicle={vehicle}
          onCancel={onClose}
          onDeleted={onDeleted}
        />
      )}
    </Modal>
  );
}

function DeleteConfirmation({
  vehicle,
  onCancel,
  onDeleted,
}: {
  vehicle: Vehicle;
  onCancel: () => void;
  onDeleted: (vehicle: Vehicle) => void;
}) {
  const { api } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setDeleting(true);
    setError(null);
    try {
      await deleteVehicle(api, vehicle.id);
      onDeleted(vehicle);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong.');
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        The listing and its stock count will be removed from the inventory for everyone.
      </p>
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" loading={deleting} loadingText="Deleting…" onClick={confirm}>
          Delete vehicle
        </Button>
      </div>
    </div>
  );
}
