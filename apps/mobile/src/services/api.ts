import type { SafeToSpendSnapshot } from '@covet/shared-types';

import { demoSnapshot } from './fixtures';

/**
 * MOCK API client for Phase 5. Same call shapes the real backend client
 * will have (Phase 6 swaps the internals for fetch calls to
 * /safe-to-spend/current etc.); screens depend only on these functions and
 * the shared types, never on the fixture module directly.
 */
export const api = {
  async getCurrentSafeToSpend(): Promise<SafeToSpendSnapshot> {
    return demoSnapshot;
  },
};
