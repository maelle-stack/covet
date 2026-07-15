import type {
  Insight,
  PurchaseCheck,
  SafeToSpendSnapshot,
  UserSettings,
} from '@covet/shared-types';

import type { ActivityFeed, CovetApi, UpcomingData } from './CovetApi';
import {
  demoActions,
  demoCommitments,
  demoInsights,
  demoPurchaseCheckReplies,
  demoPurchaseCheckResponse,
  demoRecurring,
  demoSettings,
  demoSnapshot,
  demoTransactions,
  demoVaults,
} from './fixtures';

/**
 * The >=25-transaction Insights gate is a BACKEND rule
 * (docs/01_consumer_experience.md); the fixture client mirrors it so
 * fixture mode behaves like production. The live backend enforces the same
 * gate server-side.
 */
export function gateInsights(
  insights: readonly Insight[],
  transactionCount: number,
): readonly Insight[] {
  return transactionCount >= 25 ? insights : [];
}

/**
 * Pre-integration API client backed by in-app fixtures. This is the default
 * data source for UI development and tests. It implements the exact same
 * `CovetApi` contract as the live HTTP client.
 */
export const fixtureApi: CovetApi = {
  async getCurrentSafeToSpend(): Promise<SafeToSpendSnapshot> {
    return demoSnapshot;
  },

  async getActivity(): Promise<ActivityFeed> {
    return {
      insights: gateInsights(demoInsights, demoTransactions.length),
      actions: demoActions,
      transactions: demoTransactions,
    };
  },

  async getUpcoming(): Promise<UpcomingData> {
    return {
      events: demoCommitments.filter(
        (c) => c.commitmentType === 'event' || c.commitmentType === 'travel',
      ),
      recurring: demoRecurring,
      vaults: demoVaults,
    };
  },

  async getUserSettings(): Promise<UserSettings> {
    return demoSettings;
  },

  async getSeedPurchaseCheck(): Promise<PurchaseCheck> {
    return demoPurchaseCheckResponse;
  },

  async createPurchaseCheck(_rawInput: string, index: number): Promise<PurchaseCheck> {
    const replies = demoPurchaseCheckReplies;
    return replies[index % replies.length] as PurchaseCheck;
  },
};
