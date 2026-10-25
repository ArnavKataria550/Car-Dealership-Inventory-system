import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import { CATEGORIES, type Category, type VehicleFilters } from '../../api/vehicles';
import { parseDollars } from '../../lib/money';

/** What the filter controls show, exactly as typed (prices in dollars). */
export interface FilterValues {
  make: string;
  model: string;
  category: Category | '';
  minPrice: string;
  maxPrice: string;
}

export type FilterField = keyof FilterValues;

const FIELDS: FilterField[] = ['make', 'model', 'category', 'minPrice', 'maxPrice'];

/**
 * Inventory filters stored in the URL query string, so searches can be shared
 * and the back button restores them. Returns the raw values for the inputs,
 * any price errors, and the cleaned-up filters to send to the API.
 */
export function useInventoryFilters() {
  const [params, setParams] = useSearchParams();

  const category = params.get('category') ?? '';
  const values: FilterValues = {
    make: params.get('make') ?? '',
    model: params.get('model') ?? '',
    category: (CATEGORIES as readonly string[]).includes(category) ? (category as Category) : '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
  };

  const minPriceCents = parsePrice(values.minPrice);
  const maxPriceCents = parsePrice(values.maxPrice);
  const errors: Partial<Record<'minPrice' | 'maxPrice', string>> = {};
  if (minPriceCents === null) errors.minPrice = 'Enter a valid amount';
  if (maxPriceCents === null) errors.maxPrice = 'Enter a valid amount';
  const rangeInverted =
    minPriceCents != null && maxPriceCents != null && minPriceCents > maxPriceCents;
  if (rangeInverted) errors.minPrice = "Min can't be more than max";

  const filters: VehicleFilters = {
    make: values.make,
    model: values.model,
    category: values.category || undefined,
    // Invalid bounds are left out rather than sent to the API.
    minPriceCents: rangeInverted ? undefined : (minPriceCents ?? undefined),
    maxPriceCents: rangeInverted ? undefined : (maxPriceCents ?? undefined),
  };

  const setValue = useCallback(
    (field: FilterField, value: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value.trim() === '') next.delete(field);
          else next.set(field, value);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  return {
    values,
    errors,
    filters,
    isFiltering: FIELDS.some((field) => values[field] !== ''),
    setValue,
    clear,
  };
}

/** undefined when empty, null when invalid, otherwise cents. */
function parsePrice(text: string): number | null | undefined {
  return text.trim() === '' ? undefined : parseDollars(text);
}
