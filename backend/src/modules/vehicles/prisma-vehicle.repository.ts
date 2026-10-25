import type { PrismaClient } from '../../generated/prisma/client.js';
import type { VehicleRepository } from './vehicle.repository.js';
import type { NewVehicle, Vehicle } from './vehicle.types.js';

/** VehicleRepository backed by PostgreSQL through Prisma. */
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: NewVehicle): Promise<Vehicle> {
    return this.prisma.vehicle.create({ data });
  }
}
