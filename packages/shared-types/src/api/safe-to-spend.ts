import type { SafeToSpendSnapshot } from '../models/safe-to-spend-snapshot';

/** GET /safe-to-spend/current */
export interface GetCurrentSafeToSpendResponse {
  snapshot: SafeToSpendSnapshot;
}

export const RECALCULATION_REASONS = [
  'user_requested',
  'transaction_sync',
  'commitment_change',
  'recurring_change',
  'calendar_update',
  'income_cadence_change',
  'debt_update',
  'vault_activation',
  'pattern_update',
  'scheduled_daily',
] as const;
export type RecalculationReason = (typeof RECALCULATION_REASONS)[number];

/** POST /safe-to-spend/recalculate — rate-limited server-side. */
export interface RecalculateSafeToSpendRequest {
  reason: RecalculationReason;
}

export interface RecalculateSafeToSpendResponse {
  /** False when the request was throttled or inputs were unchanged. */
  recalculated: boolean;
  snapshot: SafeToSpendSnapshot;
}
