import type { ApiClient } from './client';

export const CATEGORIES = [
  'SEDAN',
  'SUV',
  'HATCHBACK',
  'TRUCK',
  'CONVERTIBLE',
  'VAN',
  'EV',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Human-friendly label for a category ("SUV", "Hatchback", "EV"). */
export const CATEGORY_LABELS: Record<Category, string> = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  TRUCK: 'Truck',
  CONVERTIBLE: 'Convertible',
  VAN: 'Van',
  EV: 'EV',
};

/** A vehicle listing as returned by the API. Prices are integer cents. */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: Category;
  year: number;
  color: string;
  priceCents: number;
  quantity: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: Category;
  minPriceCents?: number;
  maxPriceCents?: number;
}

const path = (id: string, action = '') => `/vehicles/${encodeURIComponent(id)}${action}`;

/** All vehicles, or only those matching the filters when any are set. */
export async function fetchVehicles(api: ApiClient, filters: VehicleFilters): Promise<Vehicle[]> {
  const query = {
    make: filters.make?.trim() || undefined,
    model: filters.model?.trim() || undefined,
    category: filters.category,
    minPriceCents: filters.minPriceCents,
    maxPriceCents: filters.maxPriceCents,
  };
  const hasFilter = Object.values(query).some((value) => value !== undefined);

  const { vehicles } = hasFilter
    ? await api.get<{ vehicles: Vehicle[] }>('/vehicles/search', { query })
    : await api.get<{ vehicles: Vehicle[] }>('/vehicles');
  return vehicles;
}

export async function createVehicle(api: ApiClient, input: VehicleInput): Promise<Vehicle> {
  return (await api.post<{ vehicle: Vehicle }>('/vehicles', input)).vehicle;
}

export async function updateVehicle(
  api: ApiClient,
  id: string,
  changes: Partial<VehicleInput>,
): Promise<Vehicle> {
  return (await api.put<{ vehicle: Vehicle }>(path(id), changes)).vehicle;
}

export function deleteVehicle(api: ApiClient, id: string): Promise<void> {
  return api.delete(path(id));
}

/** One-click purchase: buys a single unit. */
export async function purchaseVehicle(api: ApiClient, id: string): Promise<Vehicle> {
  return (await api.post<{ vehicle: Vehicle }>(path(id, '/purchase'))).vehicle;
}

export async function restockVehicle(
  api: ApiClient,
  id: string,
  quantity: number,
): Promise<Vehicle> {
  return (await api.post<{ vehicle: Vehicle }>(path(id, '/restock'), { quantity })).vehicle;
}
