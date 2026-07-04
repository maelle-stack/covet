/**
 * Compile-time assertions that lock the spec-critical invariants of the
 * shared types. This file has no runtime output — it is validated by
 * `tsc --noEmit` (the package's test script). If a future edit weakens or
 * drifts one of these contracts, the build fails.
 */
import type {
  Archetype,
  Cents,
  CommitmentHardness,
  DebtPressureLevel,
  NotificationPrivacyLevel,
  SpendStatus,
  StrictnessLevel,
} from './common';
import { INTERNAL_ARCHETYPE_BY_PUBLIC, SPEND_STATUSES } from './common';
import type {
  Commitment,
  Notification,
  NotificationSeverity,
  PurchaseDecision,
  SafeToSpendSnapshot,
  Transaction,
  Vault,
} from './models';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// The four engine statuses, exactly (docs/02_financial_engine.md).
export type AssertSpendStatuses = Expect<
  Equal<SpendStatus, 'YOURE_GOOD' | 'TAKE_IT_EASY' | 'WAIT_UNTIL_PAYDAY' | 'LETS_NOT'>
>;

// Strictness: Light / Balanced / Protective, exactly.
export type AssertStrictness = Expect<Equal<StrictnessLevel, 'light' | 'balanced' | 'protective'>>;

// Commitment hardness: hard / semi-hard / soft, exactly.
export type AssertHardness = Expect<Equal<CommitmentHardness, 'hard' | 'semi_hard' | 'soft'>>;

// Six debt pressure tiers (docs/02_financial_engine.md utilization tiers).
export type AssertDebtTiers = Expect<
  Equal<DebtPressureLevel, 'healthy' | 'normal' | 'elevated' | 'high' | 'severe' | 'critical'>
>;

// Five public archetypes.
export type AssertArchetypes = Expect<
  Equal<Archetype, 'drifter' | 'spontaneous' | 'keeper' | 'giver' | 'builder'>
>;

// Notification severities: Note / Nudge / Review / Protect.
export type AssertSeverities = Expect<
  Equal<NotificationSeverity, 'note' | 'nudge' | 'review' | 'protect'>
>;

// Purchase decisions: yes / wait / no.
export type AssertDecisions = Expect<Equal<PurchaseDecision, 'yes' | 'wait' | 'no'>>;

// Privacy levels: full detail / discreet / hidden.
export type AssertPrivacyLevels = Expect<
  Equal<NotificationPrivacyLevel, 'full_detail' | 'discreet' | 'hidden'>
>;

// Safe to Spend amount is money (cents), and the snapshot carries the
// full field set the UI and Notification Engine consume.
export type AssertSnapshotAmount = Expect<Equal<SafeToSpendSnapshot['amount'], Cents>>;
type RequiredSnapshotKeys =
  | 'amount'
  | 'payCycleStart'
  | 'payCycleEnd'
  | 'daysUntilNextIncome'
  | 'dailyPace'
  | 'internalProjectedPace'
  | 'status'
  | 'confidenceScore'
  | 'externalConfidenceLabel'
  | 'protectedHardCommitments'
  | 'protectedSoftCommitments'
  | 'debtPressureLevel'
  | 'obligationPressureLevel'
  | 'emergencyFloorApplied'
  | 'behaviorBufferApplied'
  | 'majorChangeFlags'
  | 'explanationSummary'
  | 'lastCalculatedAt'
  | 'staleAfter'
  | 'inputsHash';
export type AssertSnapshotKeys = Expect<
  Equal<RequiredSnapshotKeys & keyof SafeToSpendSnapshot, RequiredSnapshotKeys>
>;

// A Notification always has both a full body and a privacy body.
export type AssertNotificationBodies = Expect<
  Equal<Notification['body'] | Notification['privacyBody'], string>
>;

// Money-bearing fields are Cents, never strings or unknown.
export type AssertTransactionAmount = Expect<Equal<Transaction['amount'], Cents>>;
export type AssertCommitmentProtected = Expect<Equal<Commitment['protectedAmount'], Cents>>;
export type AssertVaultTarget = Expect<Equal<Vault['targetAmount'], Cents>>;

// Runtime constants stay aligned with their derived types.
const spendStatusCount: 4 = SPEND_STATUSES.length;
const archetypeMappingIsTotal: Record<Archetype, string> = INTERNAL_ARCHETYPE_BY_PUBLIC;
export const _typeAssertionAnchors = { spendStatusCount, archetypeMappingIsTotal };
