import type { NewVehicle, Vehicle, VehicleChanges, VehicleSearchFilters } from './vehicle.types.js';

/** Persistence boundary for vehicles, so VehicleService does not depend on Prisma. */
export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
  /** Listings matching every given filter (an empty filter matches all), newest first. */
  search(filters: VehicleSearchFilters): Promise<Vehicle[]>;
  /** Applies the changes; resolves to null if no vehicle has that id. */
  update(id: string, changes: VehicleChanges): Promise<Vehicle | null>;
  /** Removes the vehicle; resolves to false if no vehicle has that id. */
  delete(id: string): Promise<boolean>;
}
