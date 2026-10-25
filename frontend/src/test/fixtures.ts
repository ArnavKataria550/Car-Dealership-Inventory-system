import type { Purchase } from '../api/purchases';
import type { Vehicle } from '../api/vehicles';

/** A realistic purchase record for tests; override any field. */
export function buildPurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 'pur-1',
    vehicleId: 'veh-camry',
    quantity: 1,
    unitPriceCents: 3_099_500,
    totalCents: 3_099_500,
    purchasedAt: '2026-10-25T12:00:00.000Z',
    vehicle: {
      make: 'Toyota',
      model: 'Camry XSE',
      category: 'SEDAN',
      year: 2023,
      color: 'Celestial Silver',
      imageUrl: 'https://images.example.test/camry.jpg',
    },
    buyer: { id: 'user-1', name: 'Arnav Kataria', email: 'arnav@example.com' },
    ...overrides,
  };
}

/** A realistic vehicle for tests; override any field. */
export function buildVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'veh-camry',
    make: 'Toyota',
    model: 'Camry XSE',
    category: 'SEDAN',
    year: 2023,
    color: 'Celestial Silver',
    priceCents: 3_099_500,
    quantity: 4,
    imageUrl: 'https://images.example.test/camry.jpg',
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    ...overrides,
  };
}
