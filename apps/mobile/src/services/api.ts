import type {
  Commitment,
  Insight,
  PurchaseCheck,
  RecurringItem,
  SafeToSpendSnapshot,
  Transaction,
  UserSettings,
  Vault,
} from '@covet/shared-types';

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
  type ActivityAction,
} from './fixtures';

/**
 * Pre-integration API client. These are the exact call shapes the Phase 6
 * backend client will keep (/safe-to-spend/current, activity + upcoming
 * feeds); only the internals swap from fixtures to fetch. Screens depend
 * on this module and the shared types — never on fixtures directly.
 */

export interface ActivityFeed {
  insights: readonly Insight[];
  actions: readonly ActivityAction[];
  transactions: readonly Transaction[];
}

export interface UpcomingData {
  events: readonly Commitment[];
  recurring: readonly RecurringItem[];
  vaults: readonly Vault[];
}

/**
 * The >=25-transaction Insights gate is a BACKEND rule
 * (docs/01_consumer_experience.md); this client mirrors it so the
 * pre-integration app behaves like production. The UI never re-derives it.
 */
export function gateInsights(
  insights: readonly Insight[],
  transactionCount: number,
): readonly Insight[] {
  return transactionCount >= 25 ? insights : [];
}

export const api = {
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
      // Upcoming Events: calendar/user-entered time-based commitments.
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

  /** The seeded opening exchange the Purchase Check thread starts from. */
  async getSeedPurchaseCheck(): Promise<PurchaseCheck> {
    return demoPurchaseCheckResponse;
  },

  /**
   * Returns a canned decision for the Nth message sent this session. Real
   * parsing + affordability happen on the backend in Phase 6; this cycles
   * fixture-backed yes/wait/no responses. `rawInput` is echoed back so the
   * caller can show the user's own words, but it is NOT parsed.
   */
  async createPurchaseCheck(_rawInput: string, index: number): Promise<PurchaseCheck> {
    const replies = demoPurchaseCheckReplies;
    return replies[index % replies.length] as PurchaseCheck;
  },
};

export type { ActivityAction };
