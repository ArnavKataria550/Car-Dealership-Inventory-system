import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type { VehicleRepository } from './vehicle.repository.js';
import type { NewVehicle, Vehicle } from './vehicle.types.js';

/** Newest listings first; id breaks ties so the order is always stable. */
const NEWEST_FIRST: Prisma.VehicleOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'asc' },
];

/** VehicleRepository backed by PostgreSQL through Prisma. */
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: NewVehicle): Promise<Vehicle> {
    return this.prisma.vehicle.create({ data });
  }

  findAll(): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({ orderBy: NEWEST_FIRST });
  }
}
