import type {
  Cents,
  CommitmentHardness,
  ConfidenceScore,
  ISODateTimeString,
  Metadata,
  UUID,
} from '../common';

export const COMMITMENT_SOURCES = [
  'transaction_detected',
  'calendar',
  'user_entered',
  'onboarding_context',
  'purchase_check',
] as const;
export type CommitmentSource = (typeof COMMITMENT_SOURCES)[number];

export const COMMITMENT_TYPES = [
  'rent',
  'essential_bill',
  'insurance',
  'debt_minimum',
  'subscription',
  'event',
  'travel',
  'fee', // ID replacement, application fees, admin costs
  'habit',
  'goal',
  'other',
] as const;
export type CommitmentType = (typeof COMMITMENT_TYPES)[number];

export const COMMITMENT_STATUSES = [
  'candidate', // detected, awaiting approve/deny
  'confirmed',
  'denied',
  'paused', // soft commitment paused when money is tight
  'completed',
  'expired',
] as const;
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];

/**
 * Anything Covet is actively protecting or considering
 * (docs/02_financial_engine.md, docs/05_engineering_architecture.md).
 *
 * Protection priority order (engine-wide): rent/essential bills, debt
 * minimums, confirmed non-optional commitments, emergency floor, recurring
 * habits, actively protected vaults, discretionary spending.
 */
export interface Commitment {
  id: UUID;
  userId: UUID;
  source: CommitmentSource;
  title: string;
  /** Effective amount the engine plans around (confirmed ?? estimated). */
  amount: Cents | null;
  estimatedAmount: Cents | null;
  confirmedAmount: Cents | null;
  dueAt: ISODateTimeString | null;
  commitmentType: CommitmentType;
  hardness: CommitmentHardness;
  status: CommitmentStatus;
  /** How much is currently reserved (gradual protection). */
  protectedAmount: Cents;
  protectionStartAt: ISODateTimeString | null;
  confidence: ConfidenceScore | null;
  userConfirmed: boolean;
  userDenied: boolean;
  linkedCalendarEventId: UUID | null;
  linkedTransactionId: UUID | null;
  linkedRecurringItemId: UUID | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  metadata: Metadata | null;
}
