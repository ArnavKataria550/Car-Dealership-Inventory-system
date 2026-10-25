import { createVehicle, type Vehicle } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';
import { Modal } from '../../components/ui/Modal';
import { VehicleForm } from './VehicleForm';

interface VehicleFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Receives the vehicle as saved by the API. */
  onSaved: (vehicle: Vehicle) => void;
}

/** Modal wrapper around VehicleForm for creating a listing. */
export function VehicleFormDialog({ open, onClose, onSaved }: VehicleFormDialogProps) {
  const { api } = useAuth();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a vehicle"
      description="New listings appear in the storefront straight away."
    >
      <VehicleForm
        submitLabel="Add vehicle"
        onSubmit={async (input) => onSaved(await createVehicle(api, input))}
      />
    </Modal>
  );
}
