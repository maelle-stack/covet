import type { Account, Cents, DebtPressureLevel } from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';
import { applyRate, clamp } from './money';
import type { PayoffBehaviorInput } from './types';

export interface DebtPressureResult {
  level: DebtPressureLevel;
  /** Overall utilization across all open credit accounts (0..1+). */
  utilization: number;
  /** Dollar amount subtracted from Safe to Spend for debt pressure. Never negative. */
  adjustment: Cents;
  /** True when the trusted-payoff reduction was applied. */
  trustedPayoffApplied: boolean;
}

const TIER_ORDER: readonly DebtPressureLevel[] = [
  'healthy',
  'normal',
  'elevated',
  'high',
  'severe',
  'critical',
];

function classifyUtilization(
  utilization: number,
  bounds: FinancialEngineConfig['debtUtilizationTierBounds'],
): DebtPressureLevel {
  if (utilization < bounds.healthyMax) return 'healthy';
  if (utilization < bounds.normalMax) return 'normal';
  if (utilization < bounds.elevatedMax) return 'elevated';
  if (utilization < bounds.highMax) return 'high';
  if (utilization < bounds.severeMax) return 'severe';
  return 'critical';
}

/** One tier better than `level`, or `level` itself if already `healthy`. */
function oneTierBetter(level: DebtPressureLevel): DebtPressureLevel {
  const index = TIER_ORDER.indexOf(level);
  return TIER_ORDER[Math.max(0, index - 1)] as DebtPressureLevel;
}

/**
 * Credit utilization and debt pressure (docs/02_financial_engine.md).
 * Credit card available balance NEVER increases Safe to Spend — only this
 * adjustment, which reduces it, exists. The trusted-payoff adjustment only
 * ever reduces the penalty; it is never a boost.
 */
export function computeDebtPressure(
  accounts: readonly Account[],
  payoffBehavior: PayoffBehaviorInput,
  config: FinancialEngineConfig,
): DebtPressureResult {
  const creditAccounts = accounts.filter(
    (a) =>
      a.type === 'credit' && a.status === 'active' && a.creditLimit !== null && a.creditLimit > 0,
  );

  const totalBalance = creditAccounts.reduce((sum, a) => sum + Math.max(a.currentBalance, 0), 0);
  const totalLimit = creditAccounts.reduce((sum, a) => sum + (a.creditLimit ?? 0), 0);
  const utilization = totalLimit > 0 ? totalBalance / totalLimit : 0;

  const rawLevel = classifyUtilization(utilization, config.debtUtilizationTierBounds);

  const trustedPayoffEligible =
    utilization < config.trustedPayoffMaxUtilization &&
    !payoffBehavior.minimumPaymentAtRisk &&
    payoffBehavior.consecutiveOnTimeFullPayoffCycles >= config.trustedPayoffMinObservedCycles;

  const baseRate = config.debtPressureAdjustmentRates[rawLevel];
  const adjustedRate = trustedPayoffEligible
    ? baseRate * (1 - config.trustedPayoffPenaltyReduction)
    : baseRate;

  // "capped at one utilization tier improvement": the effective level used
  // for the adjustment rate can improve by at most one tier even if the
  // reduced rate would imply more.
  const floorRate = config.debtPressureAdjustmentRates[oneTierBetter(rawLevel)];
  const effectiveRate = trustedPayoffEligible ? Math.max(adjustedRate, floorRate) : adjustedRate;

  const adjustment = clamp(applyRate(totalBalance, effectiveRate), 0, Number.MAX_SAFE_INTEGER);

  return {
    level: rawLevel,
    utilization,
    adjustment,
    trustedPayoffApplied: trustedPayoffEligible,
  };
}
