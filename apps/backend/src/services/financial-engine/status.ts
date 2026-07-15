import type {
  Cents,
  DebtPressureLevel,
  ObligationPressureLevel,
  SpendStatus,
} from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';

export interface StatusInputs {
  amount: Cents;
  daysUntilNextIncome: number | null;
  /** Any hard/semi-hard protectable item is at_risk — threatens essential stability. */
  essentialAtRisk: boolean;
  /** Any soft commitment/habit is at_risk or needs pausing. */
  softAtRisk: boolean;
  debtPressureLevel: DebtPressureLevel;
  obligationPressureLevel: ObligationPressureLevel;
  emergencyFloorApplied: Cents;
}

/**
 * Maps engine output to the four user-facing statuses
 * (docs/02_financial_engine.md). LETS_NOT is reserved for situations that
 * would jeopardize bills, debt minimums, confirmed commitments, or
 * essential stability — never just "the number is small."
 */
export function resolveSpendStatus(
  inputs: StatusInputs,
  config: FinancialEngineConfig,
): SpendStatus {
  if (inputs.essentialAtRisk) return 'LETS_NOT';

  if (inputs.amount <= 0) {
    const incomeSoon =
      inputs.daysUntilNextIncome !== null && inputs.daysUntilNextIncome <= config.incomeSoonDays;
    return incomeSoon ? 'WAIT_UNTIL_PAYDAY' : 'LETS_NOT';
  }

  if (inputs.debtPressureLevel === 'critical') return 'LETS_NOT';

  const caution =
    inputs.obligationPressureLevel === 'high' ||
    inputs.softAtRisk ||
    inputs.debtPressureLevel === 'severe' ||
    inputs.amount < inputs.emergencyFloorApplied;

  return caution ? 'TAKE_IT_EASY' : 'YOURE_GOOD';
}
