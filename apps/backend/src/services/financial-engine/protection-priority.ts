import type {
  Cents,
  Commitment,
  CommitmentHardness,
  ISODateTimeString,
  RecurringItem,
} from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';
import { clamp } from './money';

/**
 * A single thing the engine can protect this cycle, unified across
 * Commitments and RecurringItems so both can share one priority queue and
 * allocation pass. `kind` distinguishes them because only Commitments are
 * reported back in SafeToSpendSnapshot.protectedHardCommitments /
 * protectedSoftCommitments (docs/05_engineering_architecture.md).
 */
export interface ProtectableItem {
  kind: 'commitment' | 'recurring_item';
  id: string;
  title: string;
  hardness: CommitmentHardness;
  /** Priority subrank within its hardness tier; lower allocates first. */
  subrank: number;
  effectiveAmount: Cents;
  dueAt: ISODateTimeString | null;
  /** The underlying record, for building the result back onto it. */
  source: Commitment | RecurringItem;
}

export interface ProtectionOutcome {
  item: ProtectableItem;
  protectedAmount: Cents;
  /** Fraction of `effectiveAmount` the gradual-protection ramp calls for right now. */
  requiredNowFraction: number;
}

const ESSENTIAL_COMMITMENT_TYPES = new Set<Commitment['commitmentType']>([
  'rent',
  'essential_bill',
]);

/**
 * Priority order, exactly per docs/02_financial_engine.md: "rent and
 * essential bills first, minimum debt payments second, confirmed
 * non-optional commitments third, emergency floor fourth, recurring habits
 * fifth, actively protected vaults sixth, and discretionary spending last."
 * Semi-hard commitments and hard recurring bills are folded into the
 * hard-tier ordering (subranks 0-3); the emergency floor is applied by the
 * caller between subrank 3 and the soft tier (subrank 4). Vaults are
 * handled entirely separately, after this priority queue.
 */
function subrankFor(item: {
  hardness: CommitmentHardness;
  commitmentType?: Commitment['commitmentType'];
  recurringType?: RecurringItem['recurringType'];
}): number {
  if (item.hardness === 'hard') {
    if (item.commitmentType && ESSENTIAL_COMMITMENT_TYPES.has(item.commitmentType)) return 0;
    if (item.recurringType === 'bill') return 0;
    if (item.commitmentType === 'debt_minimum') return 1;
    return 2; // other hard commitments/recurring items (e.g. hard-marked insurance)
  }
  if (item.hardness === 'semi_hard') return 3;
  return 4; // soft: recurring habits and soft commitments together
}

const ALLOCATABLE_COMMITMENT_STATUSES = new Set<Commitment['status']>([
  'protected',
  'partial',
  'at_risk',
]);

export function buildProtectableItems(
  commitments: readonly Commitment[],
  recurringItems: readonly RecurringItem[],
): ProtectableItem[] {
  const commitmentItems: ProtectableItem[] = commitments
    .filter((c) => ALLOCATABLE_COMMITMENT_STATUSES.has(c.status))
    .map((c) => ({
      kind: 'commitment' as const,
      id: c.id,
      title: c.title,
      hardness: c.hardness,
      subrank: subrankFor({ hardness: c.hardness, commitmentType: c.commitmentType }),
      effectiveAmount: c.confirmedAmount ?? c.amount ?? c.estimatedAmount ?? 0,
      dueAt: c.dueAt,
      source: c,
    }));

  // Recurring items linked to a Commitment are already represented by that
  // Commitment; counting both would double-protect the same obligation.
  const linkedRecurringItemIds = new Set(
    commitments.map((c) => c.linkedRecurringItemId).filter((id): id is string => id !== null),
  );

  const recurringItemItems: ProtectableItem[] = recurringItems
    .filter(
      (r) =>
        r.status === 'confirmed' &&
        !r.userPaused &&
        !linkedRecurringItemIds.has(r.id) &&
        (r.amountEstimate ?? 0) > 0,
    )
    .map((r) => ({
      kind: 'recurring_item' as const,
      id: r.id,
      title: r.title,
      hardness: r.hardness,
      subrank: subrankFor({ hardness: r.hardness, recurringType: r.recurringType }),
      effectiveAmount: r.amountEstimate ?? 0,
      dueAt: r.nextExpectedAt,
      source: r,
    }));

  return [...commitmentItems, ...recurringItemItems].sort((a, b) => {
    if (a.subrank !== b.subrank) return a.subrank - b.subrank;
    if (a.dueAt === null && b.dueAt === null) return 0;
    if (a.dueAt === null) return 1; // no due date sorts after dated items within the same tier
    if (b.dueAt === null) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

/**
 * Gradual protection ramp (docs/02_financial_engine.md: "protected
 * gradually based on due date, amount, importance, and strictness"). No
 * due date means the item is always fully desired now (e.g. an ongoing
 * goal). Reaches full urgency at or past the due date.
 */
export function requiredNowFraction(
  item: Pick<ProtectableItem, 'dueAt' | 'hardness'>,
  now: Date,
  strictness: keyof FinancialEngineConfig['protectionWindowDays']['hard'],
  config: FinancialEngineConfig,
): number {
  if (item.dueAt === null) return 1;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = (new Date(item.dueAt).getTime() - now.getTime()) / msPerDay;
  if (daysUntilDue <= 0) return 1;

  const windowDays = config.protectionWindowDays[item.hardness][strictness];
  if (daysUntilDue >= windowDays) return 0;

  return clamp(1 - daysUntilDue / windowDays, 0, 1);
}

export function isDueSoon(
  dueAt: ISODateTimeString | null,
  now: Date,
  config: FinancialEngineConfig,
): boolean {
  if (dueAt === null) return false;
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = (new Date(dueAt).getTime() - now.getTime()) / msPerDay;
  return daysUntilDue <= config.atRiskDueSoonDays;
}

/**
 * Resolve the protection status implied by a completed allocation pass.
 * `protected` = fully covered. `partial` = something reserved but short.
 * `at_risk` = nothing reserved AND the due date is close enough to matter;
 * otherwise (nothing reserved, nothing due soon) the item is not yet in
 * its protection window, so it is reported as `protected` — there is
 * nothing to protect against yet. This tie-break is an implementation
 * decision, not a spec literal; see Phase 3 summary.
 */
export function resolveCommitmentStatus(
  effectiveAmount: Cents,
  protectedAmount: Cents,
  dueAt: ISODateTimeString | null,
  now: Date,
  config: FinancialEngineConfig,
): Commitment['status'] {
  if (effectiveAmount <= 0 || protectedAmount >= effectiveAmount) return 'protected';
  if (protectedAmount > 0) return 'partial';
  return isDueSoon(dueAt, now, config) ? 'at_risk' : 'protected';
}
