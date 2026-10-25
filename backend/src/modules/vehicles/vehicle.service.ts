import { NotFoundError } from '../../errors/app-error.js';
import type { VehicleRepository } from './vehicle.repository.js';
import type { NewVehicle, Vehicle, VehicleChanges, VehicleSearchFilters } from './vehicle.types.js';

/** Inventory rules for vehicle listings. Free of HTTP and database details. */
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  /** Adds a listing. Duplicates of an existing make/model/year/color are allowed. */
  create(input: NewVehicle): Promise<Vehicle> {
    return this.vehicles.create(input);
  }

  /** All listings, newest first, including ones that are out of stock. */
  list(): Promise<Vehicle[]> {
    return this.vehicles.findAll();
  }

  /** Listings matching all given filters (none given: every listing). */
  search(filters: VehicleSearchFilters): Promise<Vehicle[]> {
    return this.vehicles.search(filters);
  }

  /**
   * Changes only the provided fields of a listing.
   *
   * @throws NotFoundError if no vehicle has that id.
   */
  async update(id: string, changes: VehicleChanges): Promise<Vehicle> {
    const vehicle = await this.vehicles.update(id, changes);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
    return vehicle;
  }

  /**
   * Permanently removes a listing.
   *
   * @throws NotFoundError if no vehicle has that id.
   */
  async delete(id: string): Promise<void> {
    if (!(await this.vehicles.delete(id))) {
      throw new NotFoundError('Vehicle not found');
    }
  }
}
