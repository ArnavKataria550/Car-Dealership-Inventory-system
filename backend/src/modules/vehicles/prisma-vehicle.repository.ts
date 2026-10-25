import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { isRecordNotFound } from '../../lib/prisma-errors.js';
import type { VehicleRepository } from './vehicle.repository.js';
import type { NewVehicle, Vehicle, VehicleChanges, VehicleSearchFilters } from './vehicle.types.js';

/** Newest listings first; id breaks ties so the order is always stable. */
const NEWEST_FIRST: Prisma.VehicleOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'asc' },
];

function containsIgnoringCase(text: string | undefined): Prisma.StringFilter | undefined {
  return text === undefined ? undefined : { contains: text, mode: 'insensitive' };
}

/** VehicleRepository backed by PostgreSQL through Prisma. */
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: NewVehicle): Promise<Vehicle> {
    return this.prisma.vehicle.create({ data });
  }

  findAll(): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({ orderBy: NEWEST_FIRST });
  }

  search(filters: VehicleSearchFilters): Promise<Vehicle[]> {
    // Prisma skips conditions whose value is undefined, so absent filters drop out.
    return this.prisma.vehicle.findMany({
      where: {
        make: containsIgnoringCase(filters.make),
        model: containsIgnoringCase(filters.model),
        category: filters.category,
        priceCents: { gte: filters.minPriceCents, lte: filters.maxPriceCents },
      },
      orderBy: NEWEST_FIRST,
    });
  }

  async update(id: string, changes: VehicleChanges): Promise<Vehicle | null> {
    try {
      return await this.prisma.vehicle.update({ where: { id }, data: changes });
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  }
}
