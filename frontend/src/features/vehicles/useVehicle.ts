import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../../api/client';
import { fetchVehicle, type Vehicle } from '../../api/vehicles';
import { useAuth } from '../../auth/auth-context';

export type VehicleStatus = 'loading' | 'success' | 'not-found' | 'error';

interface LoadResult {
  key: string;
  vehicle: Vehicle | null;
  status: Exclude<VehicleStatus, 'loading'>;
  error: string | null;
}

/**
 * Loads one listing. Like useVehicles, each result is tagged with the request
 * that produced it, so a stale response never overwrites a newer one.
 */
export function useVehicle(id: string) {
  const { api } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const requestKey = `${id}#${attempt}`;

  useEffect(() => {
    let current = true;
    fetchVehicle(api, id).then(
      (vehicle) => {
        if (current) setResult({ key: requestKey, vehicle, status: 'success', error: null });
      },
      (error: unknown) => {
        if (!current) return;
        const notFound = error instanceof ApiError && error.status === 404;
        setResult({
          key: requestKey,
          vehicle: null,
          status: notFound ? 'not-found' : 'error',
          error: error instanceof ApiError ? error.message : 'Something went wrong.',
        });
      },
    );
    return () => {
      current = false;
    };
  }, [api, id, requestKey]);

  const settled = result?.key === requestKey;

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const replace = useCallback((vehicle: Vehicle) => {
    setResult((current) => current && { ...current, vehicle });
  }, []);

  return {
    status: settled ? result.status : ('loading' as VehicleStatus),
    // Keep showing the last known vehicle while it reloads (e.g. after a sold-out conflict).
    vehicle: result?.vehicle ?? null,
    error: settled ? result.error : null,
    reload,
    replace,
  };
}
