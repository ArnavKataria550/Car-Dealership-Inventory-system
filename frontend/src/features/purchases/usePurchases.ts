import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../../api/client';
import { fetchPurchases, type Purchase } from '../../api/purchases';
import { useAuth } from '../../auth/auth-context';

interface LoadResult {
  attempt: number;
  purchases: Purchase[];
  error: string | null;
}

/** Loads the order history (own purchases, or every sale for admins). */
export function usePurchases() {
  const { api } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    let current = true;
    fetchPurchases(api).then(
      (purchases) => {
        if (current) setResult({ attempt, purchases, error: null });
      },
      (error: unknown) => {
        if (current) {
          const message = error instanceof ApiError ? error.message : 'Something went wrong.';
          setResult({ attempt, purchases: [], error: message });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [api, attempt]);

  const settled = result?.attempt === attempt;
  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return {
    status: !settled ? 'loading' : result.error ? 'error' : 'success',
    purchases: result?.purchases ?? [],
    error: settled ? result.error : null,
    retry,
  } as const;
}
