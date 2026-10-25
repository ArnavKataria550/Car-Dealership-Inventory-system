import type { NewVehicle, Vehicle, VehicleSearchFilters } from './vehicle.types.js';

/** Persistence boundary for vehicles, so VehicleService does not depend on Prisma. */
export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
  /** Every listing, newest first. */
  findAll(): Promise<Vehicle[]>;
  /** Listings matching every given filter, newest first. */
  search(filters: VehicleSearchFilters): Promise<Vehicle[]>;
}
