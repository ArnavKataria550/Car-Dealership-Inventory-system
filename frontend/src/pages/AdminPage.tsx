import { useState } from 'react';

import { CATEGORY_LABELS, type Vehicle, type VehicleFilters } from '../api/vehicles';
import { useToast } from '../components/toast/toast-context';
import { Button } from '../components/ui/Button';
import { LoadError } from '../components/ui/LoadError';
import { DeleteVehicleDialog } from '../features/admin/DeleteVehicleDialog';
import { RestockDialog } from '../features/admin/RestockDialog';
import { VehicleFormDialog, type VehicleFormTarget } from '../features/admin/VehicleFormDialog';
import { StockBadge } from '../features/vehicles/StockBadge';
import { useVehicles } from '../features/vehicles/useVehicles';
import { vehicleTitle } from '../features/vehicles/vehicle-format';
import { formatPrice } from '../lib/money';

const ALL_VEHICLES: VehicleFilters = {};

/** Admin-only overview of the lot with tools to manage each listing. */
export function AdminPage() {
  const { status, vehicles, error, retry, removeVehicle, addVehicle, replaceVehicle } =
    useVehicles(ALL_VEHICLES);
  const { showToast } = useToast();
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [formTarget, setFormTarget] = useState<VehicleFormTarget>(null);
  const [toRestock, setToRestock] = useState<Vehicle | null>(null);

  return (
    <>
      <section className="bg-ink-950 text-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-10 pb-20 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-widest text-accent uppercase">
              Dealership
            </p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Admin dashboard</h1>
            <p className="mt-3 text-stone-400">Add, edit, restock and remove listings.</p>
          </div>
          <Button onClick={() => setFormTarget('new')}>
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            Add vehicle
          </Button>
        </div>
      </section>

      <div className="mx-auto -mt-12 max-w-7xl space-y-8 px-6 pb-16">
        <InventoryStats vehicles={vehicles} />

        {status === 'error' && <LoadError what="the inventory" message={error} onRetry={retry} />}

        <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-950/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Vehicles</caption>
              <thead className="border-b border-stone-200 bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Vehicle
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Price
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Stock
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {vehicles.map((vehicle) => (
                  <VehicleRow
                    key={vehicle.id}
                    vehicle={vehicle}
                    onEdit={setFormTarget}
                    onRestock={setToRestock}
                    onDelete={setToDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {status === 'loading' && vehicles.length === 0 && (
            <p role="status" className="px-5 py-10 text-center text-stone-500">
              Loading vehicles…
            </p>
          )}
          {status === 'success' && vehicles.length === 0 && (
            <p className="px-5 py-10 text-center text-stone-500">No vehicles yet.</p>
          )}
        </div>
      </div>

      <VehicleFormDialog
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onSaved={(saved, created) => {
          if (created) addVehicle(saved);
          else replaceVehicle(saved);
          setFormTarget(null);
          showToast({ message: `${created ? 'Added' : 'Saved'} ${vehicleTitle(saved)}` });
        }}
      />

      <RestockDialog
        vehicle={toRestock}
        onClose={() => setToRestock(null)}
        onRestocked={(updated) => {
          replaceVehicle(updated);
          setToRestock(null);
        }}
      />

      <DeleteVehicleDialog
        vehicle={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={(deleted) => {
          removeVehicle(deleted.id);
          setToDelete(null);
          showToast({ message: `Deleted ${vehicleTitle(deleted)}` });
        }}
      />
    </>
  );
}

function InventoryStats({ vehicles }: { vehicles: Vehicle[] }) {
  const units = vehicles.reduce((sum, v) => sum + v.quantity, 0);
  const soldOut = vehicles.filter((v) => v.quantity === 0).length;
  const value = vehicles.reduce((sum, v) => sum + v.quantity * v.priceCents, 0);
  const stats = [
    ['Listings', String(vehicles.length)],
    ['Units in stock', String(units)],
    ['Sold out', String(soldOut)],
    ['Stock value', formatPrice(value)],
  ];

  return (
    <ul aria-label="Inventory summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, stat]) => (
        <li key={label} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-950/5">
          <span className="block text-sm text-stone-500">{label}</span>
          <strong className="mt-1 block font-display text-3xl font-semibold">{stat}</strong>
        </li>
      ))}
    </ul>
  );
}

interface VehicleRowProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

function VehicleRow({ vehicle, onEdit, onRestock, onDelete }: VehicleRowProps) {
  const title = vehicleTitle(vehicle);

  return (
    <tr className="transition hover:bg-stone-50">
      <td className="px-5 py-3">
        <div className="flex items-center gap-4">
          <img
            src={vehicle.imageUrl}
            alt=""
            loading="lazy"
            className="h-12 w-20 shrink-0 rounded-lg bg-stone-200 object-cover"
          />
          <div>
            <p className="font-semibold whitespace-nowrap text-ink-950">{title}</p>
            <p className="text-xs text-stone-500">{vehicle.color}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-stone-700">{CATEGORY_LABELS[vehicle.category]}</td>
      <td className="px-5 py-3 font-semibold">{formatPrice(vehicle.priceCents)}</td>
      <td className="px-5 py-3">
        <StockBadge quantity={vehicle.quantity} />
      </td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label={`Edit ${title}`}
            onClick={() => onEdit(vehicle)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-800 transition hover:bg-stone-100"
          >
            Edit
          </button>
          <button
            type="button"
            aria-label={`Restock ${title}`}
            onClick={() => onRestock(vehicle)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-800 transition hover:bg-stone-100"
          >
            Restock
          </button>
          <button
            type="button"
            aria-label={`Delete ${title}`}
            onClick={() => onDelete(vehicle)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
