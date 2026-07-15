import type { ConfidenceScore, ISODateTimeString, UUID } from '../common';

export const INSIGHT_TYPES = [
  'spending_shift',
  'habit_observation',
  'timing_observation', // e.g. post-payday spending spikes
  'merchant_concentration',
  'income_observation',
  'commitment_observation',
  'other',
] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

export const INSIGHT_STATUSES = ['active', 'expired', 'dismissed'] as const;
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];

export const INSIGHT_USER_FEEDBACK = ['helpful', 'not_helpful'] as const;
export type InsightUserFeedback = (typeof INSIGHT_USER_FEEDBACK)[number];

/**
 * A behavioral-finance observation shown in Activity → Insights
 * (docs/01_consumer_experience.md). Must not generate until the user has
 * >= 25 transactions; must be grounded in user-specific evidence, never
 * generic templates; must never cite books or frameworks to the user.
 */
export interface Insight {
  id: UUID;
  userId: UUID;
  insightType: InsightType;
  title: string;
  body: string;
  evidenceSummary: string;
  confidence: ConfidenceScore;
  generatedAt: ISODateTimeString;
  expiresAt: ISODateTimeString | null;
  status: InsightStatus;
  relatedTransactionIds: readonly UUID[];
  relatedPatternIds: readonly UUID[];
  relatedCommitmentIds: readonly UUID[];
  userFeedback: InsightUserFeedback | null;
}
