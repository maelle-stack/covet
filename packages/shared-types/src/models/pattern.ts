import type { ConfidenceScore, EntityRef, ISODateTimeString, UUID } from '../common';

export const PATTERN_TYPES = [
  'recurring_bill',
  'subscription',
  'lifestyle_habit', // Pilates, weekend brunch, Sunday coffee
  'payday_cadence',
  'category_spike', // e.g. exam-week delivery/rideshare shift
  'merchant_repeat',
  'seasonal_context',
  'transfer_pattern',
  'social_spending',
  'other',
] as const;
export type PatternType = (typeof PATTERN_TYPES)[number];

export const PATTERN_STATUSES = [
  'detected',
  'suggested', // surfaced to the user for confirmation
  'confirmed',
  'denied',
  'expired',
] as const;
export type PatternStatus = (typeof PATTERN_STATUSES)[number];

/**
 * A detected behavioral/financial pattern (docs/05_engineering_architecture.md).
 * Patterns never become product truth automatically — they influence
 * candidate commitments, recurring items, insights, and actions according to
 * confidence and user confirmation. Detection must be grounded in
 * deterministic transaction evidence where available, never vague LLM
 * interpretation alone.
 */
export interface Pattern {
  id: UUID;
  userId: UUID;
  type: PatternType;
  description: string;
  confidence: ConfidenceScore;
  evidenceSummary: string;
  status: PatternStatus;
  firstDetectedAt: ISODateTimeString;
  lastDetectedAt: ISODateTimeString;
  confirmedAt: ISODateTimeString | null;
  deniedAt: ISODateTimeString | null;
  relatedEntities: readonly EntityRef[];
}
