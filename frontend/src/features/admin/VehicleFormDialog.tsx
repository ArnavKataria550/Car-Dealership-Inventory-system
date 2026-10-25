import { createVehicle, updateVehicle, type Vehicle, type VehicleInput } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';
import { Modal } from '../../components/ui/Modal';
import { vehicleTitle } from '../vehicles/vehicle-format';
import { changedFields } from './vehicle-form-validation';
import { VehicleForm } from './VehicleForm';

/** 'new' to create a listing, a vehicle to edit it, or null when the dialog is closed. */
export type VehicleFormTarget = 'new' | Vehicle | null;

interface VehicleFormDialogProps {
  target: VehicleFormTarget;
  onClose: () => void;
  /** Receives the vehicle as saved by the API, and whether it was just created. */
  onSaved: (vehicle: Vehicle, created: boolean) => void;
}

/** Modal wrapper around VehicleForm for both adding and editing a listing. */
export function VehicleFormDialog({ target, onClose, onSaved }: VehicleFormDialogProps) {
  const { api } = useAuth();
  const editing = target !== null && target !== 'new' ? target : null;

  async function save(input: VehicleInput) {
    if (!editing) {
      onSaved(await createVehicle(api, input), true);
      return;
    }
    const changes = changedFields(toInput(editing), input);
    if (Object.keys(changes).length === 0) {
      onClose(); // nothing to save
      return;
    }
    onSaved(await updateVehicle(api, editing.id, changes), false);
  }

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={editing ? `Edit ${vehicleTitle(editing)}` : 'Add a vehicle'}
      description={
        editing
          ? 'Changes appear in the storefront straight away.'
          : 'New listings appear in the storefront straight away.'
      }
    >
      <VehicleForm
        // A different target always starts from a fresh form.
        key={editing?.id ?? 'new'}
        initial={editing ? toInput(editing) : undefined}
        submitLabel={editing ? 'Save changes' : 'Add vehicle'}
        onSubmit={save}
      />
    </Modal>
  );
}

function toInput({ id: _id, createdAt: _created, updatedAt: _updated, ...input }: Vehicle) {
  return input;
}
