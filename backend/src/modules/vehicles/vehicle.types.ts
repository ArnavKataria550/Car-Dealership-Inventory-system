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

/** Largest value a Postgres INTEGER column (price, stock) can hold. */
export const MAX_INT32 = 2_147_483_647;

/** Most units an admin may add in a single restock request (agreed business rule). */
export const MAX_RESTOCK_PER_REQUEST = 100;

/** A vehicle listing as stored and returned by the API. Prices are integer cents. */
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
  createdAt: Date;
  updatedAt: Date;
}

/** Fields a client may set when creating a listing (id and timestamps are server-owned). */
export type NewVehicle = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

/** A partial update: only the provided fields change. */
export type VehicleChanges = Partial<NewVehicle>;

/** Search criteria; every field is optional and present ones are combined with AND. */
export interface VehicleSearchFilters {
  /** Case-insensitive partial match. */
  make?: string;
  /** Case-insensitive partial match. */
  model?: string;
  category?: Category;
  /** Inclusive lower bound. */
  minPriceCents?: number;
  /** Inclusive upper bound. */
  maxPriceCents?: number;
}
