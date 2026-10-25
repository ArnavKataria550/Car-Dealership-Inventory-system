import type { Vehicle } from '../api/vehicles';

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
