import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type { PurchaseRepository } from './purchase.repository.js';
import type { PurchaseView } from './purchase.types.js';

const WITH_BUYER = { buyer: { select: { id: true, name: true, email: true } } } as const;

/** Newest first; id breaks ties so the order is stable. */
const NEWEST_FIRST: Prisma.PurchaseOrderByWithRelationInput[] = [
  { createdAt: 'desc' },
  { id: 'asc' },
];

type PurchaseWithBuyer = Prisma.PurchaseGetPayload<{ include: typeof WITH_BUYER }>;

/** PurchaseRepository backed by PostgreSQL through Prisma. */
export class PrismaPurchaseRepository implements PurchaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByBuyer(buyerId: string): Promise<PurchaseView[]> {
    const rows = await this.prisma.purchase.findMany({
      where: { buyerId },
      include: WITH_BUYER,
      orderBy: NEWEST_FIRST,
    });
    return rows.map(toView);
  }

  async listAll(): Promise<PurchaseView[]> {
    const rows = await this.prisma.purchase.findMany({
      include: WITH_BUYER,
      orderBy: NEWEST_FIRST,
    });
    return rows.map(toView);
  }
}

function toView(row: PurchaseWithBuyer): PurchaseView {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    quantity: row.quantity,
    unitPriceCents: row.unitPriceCents,
    totalCents: row.quantity * row.unitPriceCents,
    purchasedAt: row.createdAt,
    vehicle: {
      make: row.make,
      model: row.model,
      category: row.category,
      year: row.year,
      color: row.color,
      imageUrl: row.imageUrl,
    },
    buyer: row.buyer,
  };
}
