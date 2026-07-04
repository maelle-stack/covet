import type {
  Cents,
  DebtPressureLevel,
  MajorChangeFlag,
  ObligationPressureLevel,
  SafeToSpendSnapshot,
  SpendStatus,
} from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';

export interface MajorChangeInputs {
  previousSnapshot: SafeToSpendSnapshot | null;
  amount: Cents;
  status: SpendStatus;
  payCycleStart: string;
  debtPressureLevel: DebtPressureLevel;
  obligationPressureLevel: ObligationPressureLevel;
  essentialAtRisk: boolean;
  softAtRisk: boolean;
}

function isMaterialChange(previous: Cents, current: Cents, config: FinancialEngineConfig): boolean {
  const m = config.materiality;
  if (previous === 0) return current !== 0;

  // Spec wording is "greater than 10%" — strictly greater, so an exact 10%
  // move falls through to the dollar-amount decrease thresholds below.
  const relativeChange = Math.abs(current - previous) / Math.abs(previous);
  if (relativeChange > m.relativeChangeThreshold) return true;

  if (current < previous) {
    const decrease = previous - current;
    const threshold =
      previous < m.lowBalanceThresholdCents
        ? m.lowBalanceDecreaseThresholdCents
        : m.normalDecreaseThresholdCents;
    return decrease >= threshold;
  }

  return false;
}

/**
 * Detects the major-change events the Financial Engine must expose to the
 * Notification Engine (docs/02_financial_engine.md). This module only
 * exposes candidate flags — materiality, suppression, batching, and quiet
 * hours are the Notification Engine's job (Phase 4), not this engine's.
 * The very first snapshot for a user has nothing to compare against, so it
 * carries no flags.
 */
export function detectMajorChangeFlags(
  inputs: MajorChangeInputs,
  config: FinancialEngineConfig,
): MajorChangeFlag[] {
  const flags = new Set<MajorChangeFlag>();
  const { previousSnapshot } = inputs;

  if (inputs.essentialAtRisk || inputs.softAtRisk) flags.add('commitment_at_risk');

  if (!previousSnapshot) {
    return Array.from(flags);
  }

  if (previousSnapshot.status !== inputs.status) flags.add('status_changed');

  if (isMaterialChange(previousSnapshot.amount, inputs.amount, config)) {
    flags.add(inputs.amount > previousSnapshot.amount ? 'material_increase' : 'material_decrease');
  }

  if (
    new Date(inputs.payCycleStart).getTime() >= new Date(previousSnapshot.payCycleEnd).getTime()
  ) {
    flags.add('income_landed');
  }

  if (
    previousSnapshot.majorChangeFlags.includes('commitment_at_risk') &&
    !inputs.essentialAtRisk &&
    !inputs.softAtRisk
  ) {
    flags.add('commitment_covered');
  }

  if (previousSnapshot.debtPressureLevel !== inputs.debtPressureLevel) {
    flags.add('debt_pressure_changed');
  }

  if (previousSnapshot.obligationPressureLevel !== inputs.obligationPressureLevel) {
    flags.add('obligation_pressure_changed');
  }

  return Array.from(flags);
}
