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
  findById(id: string): Promise<Vehicle | null>;
  /**
   * Atomically lowers the stock by `quantity`, but only if at least that many
   * units are available. Resolves to the updated vehicle, or null if the
   * vehicle does not exist or has too few units (nothing is changed then).
   */
  decrementStockIfAvailable(id: string, quantity: number): Promise<Vehicle | null>;
  /**
   * Atomically raises the stock by `quantity`, but only if the new total still
   * fits the INTEGER column. Resolves to the updated vehicle, or null if the
   * vehicle does not exist or there is no room (nothing is changed then).
   */
  incrementStockIfRoom(id: string, quantity: number): Promise<Vehicle | null>;
}
