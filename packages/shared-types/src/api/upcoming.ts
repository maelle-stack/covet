import type { Commitment } from '../models/commitment';
import type { RecurringItem } from '../models/recurring-item';
import type { Vault } from '../models/vault';

/**
 * GET /upcoming — the composite Upcoming view (time-based Events, Recurring
 * items, and Vaults). Passive vaults are included but flagged
 * `activelyProtected: false`, so the screen can present them as saved-but-
 * not-protecting-Safe-to-Spend (docs/01_consumer_experience.md).
 */
export interface UpcomingResponse {
  events: readonly Commitment[];
  recurring: readonly RecurringItem[];
  vaults: readonly Vault[];
}
