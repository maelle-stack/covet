import type {
  ActivityFeedResponse,
  PurchaseCheck,
  SafeToSpendSnapshot,
  UpcomingResponse,
  UserSettings,
} from '@covet/shared-types';

import {
  DEMO_USER_ID,
  demoActions,
  demoCommitments,
  demoInsights,
  demoRecurring,
  demoSeedPurchaseCheck,
  demoSettings,
  demoSnapshot,
  demoTransactions,
  demoVaults,
} from '../db/seed-data';
import { gateInsights, type CovetRepositories } from './types';

/**
 * In-memory repository backed by the canonical demo dataset. This is the
 * default data source: it lets the real backend serve the read endpoints
 * with zero external services, so UI development, CI, and the fixture→live
 * switch all work without a database. The Postgres repository is a drop-in
 * replacement that reads the same shapes from a real DB.
 */
export function createMemoryRepositories(): CovetRepositories {
  const owns = (userId: string) => userId === DEMO_USER_ID;

  return {
    async getLatestSnapshot(userId): Promise<SafeToSpendSnapshot | null> {
      return owns(userId) ? demoSnapshot : null;
    },

    async getActivity(userId): Promise<ActivityFeedResponse | null> {
      if (!owns(userId)) return null;
      return {
        insights: gateInsights(demoInsights, demoTransactions.length),
        actions: demoActions,
        transactions: demoTransactions,
      };
    },

    async getUpcoming(userId): Promise<UpcomingResponse | null> {
      if (!owns(userId)) return null;
      return {
        events: demoCommitments.filter(
          (c) => c.commitmentType === 'event' || c.commitmentType === 'travel',
        ),
        recurring: demoRecurring,
        vaults: demoVaults,
      };
    },

    async getUserSettings(userId): Promise<UserSettings | null> {
      return owns(userId) ? demoSettings : null;
    },

    async getSeedPurchaseCheck(userId): Promise<PurchaseCheck | null> {
      return owns(userId) ? demoSeedPurchaseCheck : null;
    },

    async close() {
      /* nothing to release */
    },
  };
}
