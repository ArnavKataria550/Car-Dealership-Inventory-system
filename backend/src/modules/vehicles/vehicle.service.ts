import { ConflictError, InsufficientStockError, NotFoundError } from '../../errors/app-error.js';
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
    return this.vehicles.search({});
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

  /**
   * Buys `quantity` units, lowering the stock atomically.
   *
   * @throws NotFoundError if no vehicle has that id.
   * @throws InsufficientStockError if fewer than `quantity` units are in stock.
   */
  async purchase(id: string, quantity: number): Promise<Vehicle> {
    const updated = await this.vehicles.decrementStockIfAvailable(id, quantity);
    if (updated) {
      return updated;
    }

    // Nothing changed: work out why, for an accurate error.
    const current = await this.vehicles.findById(id);
    if (!current) {
      throw new NotFoundError('Vehicle not found');
    }
    throw new InsufficientStockError(current.quantity);
  }

  /**
   * Adds `quantity` units to the stock (admin only; the per-request cap is
   * enforced by the request schema).
   *
   * @throws NotFoundError if no vehicle has that id.
   * @throws ConflictError if the new total would exceed the storable maximum.
   */
  async restock(id: string, quantity: number): Promise<Vehicle> {
    const updated = await this.vehicles.incrementStockIfRoom(id, quantity);
    if (updated) {
      return updated;
    }

    if (!(await this.vehicles.findById(id))) {
      throw new NotFoundError('Vehicle not found');
    }
    throw new ConflictError('Restock would exceed the maximum stock level');
  }
}
