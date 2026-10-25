import type { NewVehicle, Vehicle, VehicleChanges, VehicleSearchFilters } from './vehicle.types.js';

/** Persistence boundary for vehicles, so VehicleService does not depend on Prisma. */
export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
  /** Every listing, newest first. */
  findAll(): Promise<Vehicle[]>;
  /** Listings matching every given filter, newest first. */
  search(filters: VehicleSearchFilters): Promise<Vehicle[]>;
  /** Applies the changes; resolves to null if no vehicle has that id. */
  update(id: string, changes: VehicleChanges): Promise<Vehicle | null>;
}
