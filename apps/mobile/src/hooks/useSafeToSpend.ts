import { useQuery } from '@tanstack/react-query';

import { api } from '../services/api';

/**
 * Server-state hook for the SafeToSpendSnapshot (TanStack Query owns
 * server state per docs/05_engineering_architecture.md). The snapshot is
 * consumed as-is: Home renders what the backend calculated, nothing more.
 */
export function useSafeToSpend() {
  return useQuery({
    queryKey: ['safe-to-spend', 'current'],
    queryFn: api.getCurrentSafeToSpend,
  });
}
