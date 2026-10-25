import type { NewVehicle, Vehicle } from './vehicle.types.js';

/** Persistence boundary for vehicles, so VehicleService does not depend on Prisma. */
export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
  /** Every listing, newest first. */
  findAll(): Promise<Vehicle[]>;
}
