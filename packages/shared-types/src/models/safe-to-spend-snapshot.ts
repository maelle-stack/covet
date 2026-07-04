import type {
  Cents,
  CommitmentHardness,
  ConfidenceScore,
  DebtPressureLevel,
  ExternalConfidenceLabel,
  ISODateString,
  ISODateTimeString,
  ObligationPressureLevel,
  SpendStatus,
  UUID,
} from '../common';

/** Flags describing what materially changed since the previous snapshot. */
export const MAJOR_CHANGE_FLAGS = [
  'status_changed',
  'material_increase', // > 10% or dollar-threshold increase
  'material_decrease',
  'income_landed',
  'commitment_at_risk',
  'commitment_covered',
  'connection_lost',
  'debt_pressure_changed',
  'obligation_pressure_changed',
] as const;
export type MajorChangeFlag = (typeof MAJOR_CHANGE_FLAGS)[number];

/**
 * Denormalized reference to a commitment protected inside a snapshot, used
 * by the explanation layer ("I'm protecting rent, your card minimum, brunch
 * this weekend..."). The Commitment table remains the source of truth; this
 * is an immutable copy taken at calculation time.
 */
export interface ProtectedCommitmentRef {
  commitmentId: UUID;
  title: string;
  hardness: CommitmentHardness;
  protectedAmount: Cents;
}

/**
 * The primary Financial Engine output (docs/02_financial_engine.md).
 * Generated ONLY by the backend engine; Home, Purchase Check, Upcoming,
 * Activity, and Notifications all consume this object. The client must
 * never recalculate any of these fields.
 */
export interface SafeToSpendSnapshot {
  id: UUID;
  userId: UUID;
  /** Safe to Spend for the current pay cycle. May be negative; the UI shows a protective status instead of a fake positive. */
  amount: Cents;
  payCycleStart: ISODateString;
  payCycleEnd: ISODateString;
  daysUntilNextIncome: number | null; // null when income is unconfirmed/irregular
  /** User-facing pace: amount / days until payday. */
  dailyPace: Cents | null;
  /** Internal projected pace accounting for uneven days and learned habits. */
  internalProjectedPace: Cents | null;
  status: SpendStatus;
  confidenceScore: ConfidenceScore;
  externalConfidenceLabel: ExternalConfidenceLabel;
  protectedHardCommitments: readonly ProtectedCommitmentRef[];
  protectedSoftCommitments: readonly ProtectedCommitmentRef[];
  debtPressureLevel: DebtPressureLevel;
  obligationPressureLevel: ObligationPressureLevel;
  /** Emergency floor amount withheld (starts at 10% of checking). */
  emergencyFloorApplied: Cents;
  /** Behavior buffer amount withheld (archetype + strictness + behavior). */
  behaviorBufferApplied: Cents;
  majorChangeFlags: readonly MajorChangeFlag[];
  /** Conclusion-first, plain-language summary. Never the full formula. */
  explanationSummary: string;
  lastCalculatedAt: ISODateTimeString;
  /** After this time the client must present the snapshot as stale. */
  staleAfter: ISODateTimeString;
  /** Hash of engine inputs, for change detection and idempotent recalcs. */
  inputsHash: string;
}
