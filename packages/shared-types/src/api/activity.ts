import type { Insight } from '../models/insight';
import type { Transaction } from '../models/transaction';

/**
 * An Activity "Action": something that needs quick user attention
 * (docs/01_consumer_experience.md). Copy is backend-authored — in
 * production it comes from the context/pattern services; the screen never
 * composes review language itself.
 */
export type ActivityActionKind =
  'commitment_candidate' | 'recurring_detected' | 'pattern_confirmation';

export interface ActivityAction {
  id: string;
  kind: ActivityActionKind;
  body: string;
  relatedEntityId: string;
}

/**
 * GET /activity — the composite Activity feed (Insights, Actions,
 * Transactions). Insights arrive already gated by the backend's
 * >=25-transaction rule; the screen renders what the feed contains.
 */
export interface ActivityFeedResponse {
  insights: readonly Insight[];
  actions: readonly ActivityAction[];
  transactions: readonly Transaction[];
}
