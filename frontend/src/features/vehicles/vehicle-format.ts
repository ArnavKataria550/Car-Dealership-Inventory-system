import type { Vehicle } from '../../api/vehicles';

/** "2023 Toyota Camry XSE": how a listing is named everywhere in the UI. */
export function vehicleTitle({ year, make, model }: Pick<Vehicle, 'year' | 'make' | 'model'>) {
  return `${year} ${make} ${model}`;
}

/** Below this many units the stock badge turns amber ("Only 2 left"). */
export const LOW_STOCK_THRESHOLD = 2;
