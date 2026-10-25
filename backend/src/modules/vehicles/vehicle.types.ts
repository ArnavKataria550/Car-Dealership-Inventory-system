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
