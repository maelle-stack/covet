import type { RecalculationReason, SafeToSpendSnapshot } from '@covet/shared-types';

import type { CovetRepositories, EngineInputBundle } from '../../repositories';
import { calculateSafeToSpend, type SafeToSpendEngineInput } from '../financial-engine';

/**
 * The recalculation orchestrator: the single place the Financial Engine is
 * invoked. It gathers persisted inputs from the repositories, layers on the
 * signals not yet modeled as tables, runs the pure engine, and appends the
 * result (snapshots are append-only). It never computes money itself — that
 * is entirely the engine's job (docs/02, docs/05).
 *
 * `now` is injectable for deterministic tests; production passes the wall
 * clock. If the recomputed inputs are unchanged from the latest snapshot
 * (same inputs hash), it is a no-op: `recalculated: false`, no new row.
 */
export interface RecalculationResult {
  recalculated: boolean;
  snapshot: SafeToSpendSnapshot;
}

export async function recalculateSafeToSpend(
  repos: CovetRepositories,
  userId: string,
  _reason: RecalculationReason,
  now: string = new Date().toISOString(),
): Promise<RecalculationResult | null> {
  const bundle = await repos.getEngineInputs(userId);
  if (!bundle) return null;

  const previous = await repos.getLatestSnapshot(userId);
  const input = buildEngineInput(bundle, userId, now, previous);
  const snapshot = calculateSafeToSpend(input);

  // Idempotent: identical inputs produce an identical hash, so skip the
  // append and report no change (the engine excludes `now` from the hash).
  if (previous && previous.inputsHash === snapshot.inputsHash) {
    return { recalculated: false, snapshot: previous };
  }

  await repos.appendSnapshot(snapshot);
  return { recalculated: true, snapshot };
}

function buildEngineInput(
  bundle: EngineInputBundle,
  userId: string,
  now: string,
  previous: SafeToSpendSnapshot | null,
): SafeToSpendEngineInput {
  // Active commitments only (the engine ignores denied/completed anyway, but
  // filtering here keeps the input honest).
  const commitments = bundle.commitments.filter(
    (c) => c.status !== 'denied' && c.status !== 'completed',
  );

  // Confirmed recurring items the engine should treat as obligations —
  // excluding any already represented by a Commitment (avoids double-count).
  const linkedRecurringIds = new Set(
    commitments.map((c) => c.linkedRecurringItemId).filter((id): id is string => id !== null),
  );
  const recurringItems = bundle.recurringItems.filter(
    (r) => r.status === 'confirmed' && !linkedRecurringIds.has(r.id),
  );

  return {
    userId,
    now,
    accounts: bundle.accounts,
    transactions: bundle.transactions,
    commitments,
    recurringItems,
    vaults: bundle.vaults,
    // Archetype defaults to the most protective when the quiz hasn't run.
    primaryArchetype: bundle.user.primaryArchetype ?? 'keeper',
    strictness: bundle.user.strictnessLevel,
    // The following are pattern/Plaid-derived in later checkpoints. Until
    // then the engine runs with conservative defaults and correctly lowers
    // confidence (income cadence unconfirmed).
    expectedCycleIncome: 0,
    incomeCadence: { type: 'biweekly', confirmed: false, nextExpectedAt: null },
    pendingIncome: null,
    payoffBehavior: { consecutiveOnTimeFullPayoffCycles: 0, minimumPaymentAtRisk: false },
    bankConnectionStatus: bundle.bankConnectionStatus,
    calendarConnected: bundle.calendarConnected,
    previousSnapshot: previous,
  };
}
