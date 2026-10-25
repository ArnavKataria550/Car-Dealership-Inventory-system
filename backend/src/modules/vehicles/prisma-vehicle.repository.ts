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

  async delete(id: string): Promise<boolean> {
    // deleteMany never throws for a missing row, so no error mapping is needed.
    const { count } = await this.prisma.vehicle.deleteMany({ where: { id } });
    return count > 0;
  }

  findById(id: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({ where: { id } });
  }

  decrementStockIfAvailable(id: string, quantity: number): Promise<Vehicle | null> {
    return this.prisma.$transaction(async (tx) => {
      // One conditional UPDATE: the stock check and the decrement happen in the
      // same statement, so two buyers can never both take the last unit.
      const { count } = await tx.vehicle.updateMany({
        where: { id, quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      });
      if (count === 0) {
        return null;
      }
      // Our UPDATE holds the row lock until commit, so this read sees exactly our result.
      return tx.vehicle.findUniqueOrThrow({ where: { id } });
    });
  }
}
