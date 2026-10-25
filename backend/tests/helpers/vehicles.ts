import type { Prisma } from '../../src/generated/prisma/client.js';
import { prisma } from './database.js';

const vehicleDefaults = {
  make: 'Toyota',
  model: 'Camry',
  category: 'SEDAN',
  year: 2024,
  color: 'Black',
  priceCents: 2_799_900,
  quantity: 3,
  imageUrl: 'https://images.example.com/toyota-camry-2024.jpg',
} satisfies Prisma.VehicleCreateInput;

/** A valid POST /api/vehicles body; override (or break) any field per test. */
export function buildVehicleInput(overrides: Record<string, unknown> = {}) {
  return { ...vehicleDefaults, ...overrides };
}

/** Inserts a vehicle directly, bypassing the API, for tests that need existing stock. */
export function createVehicle(overrides: Partial<Prisma.VehicleCreateInput> = {}) {
  return prisma.vehicle.create({ data: { ...vehicleDefaults, ...overrides } });
}
