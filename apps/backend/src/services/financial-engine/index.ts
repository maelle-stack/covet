import { randomUUID } from 'node:crypto';

import type {
  Cents,
  Commitment,
  ProtectedCommitmentRef,
  SafeToSpendSnapshot,
} from '@covet/shared-types';

import { computeUsableCheckingCash } from './checking-cash';
import { computeConfidence } from './confidence';
import { mergeFinancialEngineConfig } from './config';
import { computeDebtPressure } from './debt-pressure';
import { buildExplanationSummary } from './explanation';
import { computeInputsHash } from './inputs-hash';
import { applyRate, roundDownToDollar } from './money';
import { detectMajorChangeFlags } from './major-change';
import { computeObligationPressure } from './obligation-pressure';
import { computePayCycle } from './pay-cycle';
import { computePendingIncomeAdjustment } from './pending-income';
import {
  buildProtectableItems,
  requiredNowFraction,
  resolveCommitmentStatus,
  type ProtectableItem,
} from './protection-priority';
import { computeBehaviorBuffer } from './behavior-buffer';
import { resolveSpendStatus } from './status';
import type { SafeToSpendEngineInput } from './types';
import { allocateToVaults } from './vaults';

export * from './config';
export * from './types';
export type { DebtPressureResult } from './debt-pressure';
export type { ObligationPressureResult } from './obligation-pressure';
export type { ConfidenceResult } from './confidence';

interface AllocatedItem {
  item: ProtectableItem;
  protectedAmount: Cents;
  status: Commitment['status'];
}

/**
 * The Financial Engine: pure, deterministic, and the sole owner of Safe to
 * Spend (docs/02_financial_engine.md, docs/05_engineering_architecture.md).
 * No I/O, no randomness beyond a fresh snapshot id, no LLM calls. Same
 * input always produces the same output.
 */
export function calculateSafeToSpend(input: SafeToSpendEngineInput): SafeToSpendSnapshot {
  const config = mergeFinancialEngineConfig(input.config);
  const now = new Date(input.now);

  // --- Usable cash ----------------------------------------------------
  const usableCheckingCash = computeUsableCheckingCash(input.accounts, input.transactions);
  let cash = usableCheckingCash;

  // --- Pay cycle --------------------------------------------------------
  const payCycle = computePayCycle(now, input.incomeCadence, config);

  // --- Priority-ordered protection: hard/semi-hard tiers first ---------
  const protectableItems = buildProtectableItems(input.commitments, input.recurringItems);
  const allocations = new Map<string, AllocatedItem>();

  const allocateTier = (items: readonly ProtectableItem[]) => {
    for (const item of items) {
      const frac = requiredNowFraction(item, now, input.strictness, config);
      const target = Math.round(item.effectiveAmount * frac);
      const available = Math.max(cash, 0);
      const allocated = Math.min(target, available);
      cash -= allocated;

      const status = resolveCommitmentStatus(
        item.effectiveAmount,
        allocated,
        item.dueAt,
        now,
        config,
      );
      allocations.set(item.id, { item, protectedAmount: allocated, status });
    }
  };

  const hardSemiHardItems = protectableItems.filter((i) => i.subrank <= 3);
  const softItems = protectableItems.filter((i) => i.subrank === 4);

  allocateTier(hardSemiHardItems);

  // --- Emergency floor (fourth priority) --------------------------------
  const emergencyFloorTarget = Math.max(
    0,
    applyRate(Math.max(usableCheckingCash, 0), config.emergencyFloorRate),
  );
  const emergencyFloorApplied = Math.min(emergencyFloorTarget, Math.max(cash, 0));
  cash -= emergencyFloorApplied;

  // --- Recurring habits / soft commitments (fifth priority) -------------
  allocateTier(softItems);

  // --- Behavior buffer ---------------------------------------------------
  const flexibleDiscretionaryCash = Math.max(cash, 0);

  const obligationPressure = computeObligationPressure(
    input.commitments,
    input.expectedCycleIncome,
    config,
  );

  const behaviorBuffer = computeBehaviorBuffer(
    flexibleDiscretionaryCash,
    input.primaryArchetype,
    input.strictness,
    obligationPressure.level,
    config,
  );
  cash -= behaviorBuffer.amount;

  // --- Debt pressure adjustment -------------------------------------------
  const debtPressure = computeDebtPressure(input.accounts, input.payoffBehavior, config);
  cash -= debtPressure.adjustment;

  // --- Vaults (sixth priority) ---------------------------------------------
  const vaultAllocation = allocateToVaults(input.vaults, Math.max(cash, 0));
  cash -= vaultAllocation.totalAllocated;

  // --- Pending income adjustment (capped, conservative) ---------------------
  const pendingIncomeAdjustment = computePendingIncomeAdjustment(
    input.pendingIncome,
    input.incomeCadence,
    now,
    config,
  );
  cash += pendingIncomeAdjustment;

  const amount = roundDownToDollar(cash);

  // --- Risk flags from the allocation pass -----------------------------
  const essentialAtRisk = hardSemiHardItems.some(
    (i) => allocations.get(i.id)?.status === 'at_risk',
  );
  const softAtRisk = softItems.some((i) => allocations.get(i.id)?.status === 'at_risk');

  // --- Status -------------------------------------------------------------
  const status = resolveSpendStatus(
    {
      amount,
      daysUntilNextIncome: payCycle.daysUntilNextIncome,
      essentialAtRisk,
      softAtRisk,
      debtPressureLevel: debtPressure.level,
      obligationPressureLevel: obligationPressure.level,
      emergencyFloorApplied,
    },
    config,
  );

  // --- Confidence -----------------------------------------------------------
  const relevantCommitments = input.commitments.filter(
    (c) => c.status !== 'denied' && c.status !== 'completed',
  );
  const unconfirmedCommitmentRatio =
    relevantCommitments.length === 0
      ? 0
      : relevantCommitments.filter((c) => c.status === 'candidate').length /
        relevantCommitments.length;

  const pendingDebitTotal = input.transactions
    .filter((t) => t.pending && !t.isTransfer && !t.excludedFromSpending && t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingCashRatio = usableCheckingCash > 0 ? pendingDebitTotal / usableCheckingCash : 0;

  const confidence = computeConfidence(
    {
      bankConnectionStatus: input.bankConnectionStatus,
      incomeCadenceConfirmed: input.incomeCadence.confirmed,
      calendarConnected: input.calendarConnected,
      unconfirmedCommitmentRatio,
      pendingCashRatio,
    },
    config,
  );

  // --- Pace -----------------------------------------------------------------
  const dailyPace =
    payCycle.daysUntilNextIncome !== null && payCycle.daysUntilNextIncome > 0
      ? Math.floor(amount / payCycle.daysUntilNextIncome)
      : null;
  // v1 simplification: no day-by-day habit distribution modeled yet, so the
  // internal projected pace equals the simple daily pace. A real weighted
  // projection is future work, not a spec literal for Phase 3.
  const internalProjectedPace = dailyPace;

  // --- Protected commitment refs for the explanation layer -----------------
  const toRef = (a: AllocatedItem): ProtectedCommitmentRef => ({
    commitmentId: a.item.id,
    title: a.item.title,
    hardness: a.item.hardness,
    protectedAmount: a.protectedAmount,
  });

  const protectedHardCommitments: ProtectedCommitmentRef[] = hardSemiHardItems
    .map((i) => allocations.get(i.id)!)
    .filter((a) => a.item.kind === 'commitment' && a.protectedAmount > 0)
    .map(toRef);

  const protectedSoftCommitments: ProtectedCommitmentRef[] = softItems
    .map((i) => allocations.get(i.id)!)
    .filter((a) => a.item.kind === 'commitment' && a.protectedAmount > 0)
    .map(toRef);

  const explanationSummary = buildExplanationSummary(
    protectedHardCommitments,
    protectedSoftCommitments,
    dailyPace,
    payCycle.daysUntilNextIncome,
  );

  const majorChangeFlags = detectMajorChangeFlags(
    {
      previousSnapshot: input.previousSnapshot,
      amount,
      status,
      payCycleStart: payCycle.payCycleStart,
      debtPressureLevel: debtPressure.level,
      obligationPressureLevel: obligationPressure.level,
      essentialAtRisk,
      softAtRisk,
    },
    config,
  );

  const inputsHash = computeInputsHash({
    accounts: input.accounts,
    transactions: input.transactions,
    commitments: input.commitments,
    recurringItems: input.recurringItems,
    vaults: input.vaults,
    primaryArchetype: input.primaryArchetype,
    strictness: input.strictness,
    expectedCycleIncome: input.expectedCycleIncome,
    incomeCadence: input.incomeCadence,
    pendingIncome: input.pendingIncome,
    payoffBehavior: input.payoffBehavior,
    bankConnectionStatus: input.bankConnectionStatus,
    calendarConnected: input.calendarConnected,
  });

  const staleAfter = new Date(
    now.getTime() + config.snapshotStaleAfterHours * 60 * 60 * 1000,
  ).toISOString();

  return {
    id: randomUUID(),
    userId: input.userId,
    amount,
    payCycleStart: payCycle.payCycleStart,
    payCycleEnd: payCycle.payCycleEnd,
    daysUntilNextIncome: payCycle.daysUntilNextIncome,
    dailyPace,
    internalProjectedPace,
    status,
    confidenceScore: confidence.score,
    externalConfidenceLabel: confidence.label,
    protectedHardCommitments,
    protectedSoftCommitments,
    debtPressureLevel: debtPressure.level,
    obligationPressureLevel: obligationPressure.level,
    emergencyFloorApplied,
    behaviorBufferApplied: behaviorBuffer.amount,
    majorChangeFlags,
    explanationSummary,
    lastCalculatedAt: input.now,
    staleAfter,
    inputsHash,
  };
}
