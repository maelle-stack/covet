import type {
  Cents,
  CommitmentHardness,
  ConfidenceScore,
  ISODateTimeString,
  Metadata,
  UUID,
} from '../common';

export const RECURRING_CADENCES = [
  'weekly',
  'biweekly',
  'semimonthly',
  'monthly',
  'quarterly',
  'yearly',
  'irregular',
] as const;
export type RecurringCadence = (typeof RECURRING_CADENCES)[number];

export const RECURRING_TYPES = ['bill', 'subscription', 'habit'] as const;
export type RecurringType = (typeof RECURRING_TYPES)[number];

export const RECURRING_ITEM_STATUSES = [
  'detected', // awaiting user confirmation
  'confirmed',
  'denied',
  'ended',
] as const;
export type RecurringItemStatus = (typeof RECURRING_ITEM_STATUSES)[number];

/**
 * Bills, subscriptions, and lifestyle habits together
 * (docs/01_consumer_experience.md Recurring). Habits affect Safe to Spend
 * as soft commitments and can be paused when money is tight; bills and
 * subscriptions are protected more strongly.
 */
export interface RecurringItem {
  id: UUID;
  userId: UUID;
  title: string;
  merchantName: string | null;
  amountEstimate: Cents | null;
  cadence: RecurringCadence;
  nextExpectedAt: ISODateTimeString | null;
  recurringType: RecurringType;
  hardness: CommitmentHardness;
  confidence: ConfidenceScore | null;
  status: RecurringItemStatus;
  linkedPatternId: UUID | null;
  lastSeenAt: ISODateTimeString | null;
  userConfirmed: boolean;
  userPaused: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  metadata: Metadata | null;
}
