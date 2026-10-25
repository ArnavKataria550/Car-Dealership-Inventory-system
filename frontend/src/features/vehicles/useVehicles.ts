import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../../api/client';
import { fetchVehicles, type Vehicle, type VehicleFilters } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';

export type LoadStatus = 'loading' | 'success' | 'error';

interface LoadResult {
  /** Which request (filters + attempt) produced this result. */
  key: string;
  vehicles: Vehicle[];
  error: string | null;
}

/**
 * Loads the vehicles matching `filters` and keeps them in local state so a
 * purchase or edit can update a single card without refetching everything.
 *
 * Results are tagged with the request that produced them: a slow response for
 * old filters can never overwrite a newer one, and while new filters load the
 * previous results stay on screen instead of flashing to a skeleton.
 */
export function useVehicles(filters: VehicleFilters) {
  const { api } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const requestKey = JSON.stringify({ filters, attempt });

  useEffect(() => {
    let current = true;
    const { filters: requested } = JSON.parse(requestKey) as { filters: VehicleFilters };

    fetchVehicles(api, requested).then(
      (vehicles) => {
        if (current) setResult({ key: requestKey, vehicles, error: null });
      },
      (error: unknown) => {
        if (current) {
          const message = error instanceof ApiError ? error.message : 'Something went wrong.';
          setResult({ key: requestKey, vehicles: [], error: message });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [api, requestKey]);

  const settled = result?.key === requestKey;
  const status: LoadStatus = !settled ? 'loading' : result.error ? 'error' : 'success';

  /** Swap in a vehicle returned by the API (after a purchase, edit or restock). */
  const replaceVehicle = useCallback((updated: Vehicle) => {
    setResult(
      (current) =>
        current && {
          ...current,
          vehicles: current.vehicles.map((v) => (v.id === updated.id ? updated : v)),
        },
    );
  }, []);

  const removeVehicle = useCallback((id: string) => {
    setResult(
      (current) => current && { ...current, vehicles: current.vehicles.filter((v) => v.id !== id) },
    );
  }, []);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return {
    status,
    vehicles: result?.vehicles ?? [],
    error: settled ? result.error : null,
    retry,
    replaceVehicle,
    removeVehicle,
  };
}
