import type { VehicleRepository } from './vehicle.repository.js';
import type { NewVehicle, Vehicle } from './vehicle.types.js';

/** Inventory rules for vehicle listings. Free of HTTP and database details. */
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  /** Adds a listing. Duplicates of an existing make/model/year/color are allowed. */
  create(input: NewVehicle): Promise<Vehicle> {
    return this.vehicles.create(input);
  }
}
