import type { Cents, Commitment, ObligationPressureLevel } from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';

/** Commitment types treated as mandatory for obligation-pressure purposes. */
const MANDATORY_COMMITMENT_TYPES = new Set<Commitment['commitmentType']>([
  'rent',
  'essential_bill',
  'insurance',
  'debt_minimum',
]);

export interface ObligationPressureResult {
  level: ObligationPressureLevel;
  /** Mandatory obligations as a fraction of confirmed cycle income (0..1+). */
  ratio: number;
}

/**
 * Obligation pressure (docs/02_financial_engine.md): uses the SHARE of
 * confirmed cycle income already committed to mandatory obligations, not
 * income amount alone. Optional habits (brunch, Pilates, beauty, shopping)
 * never count as mandatory here, even though they still affect Safe to
 * Spend as soft commitments elsewhere in the engine.
 */
export function computeObligationPressure(
  activeCommitments: readonly Commitment[],
  confirmedCycleIncome: Cents,
  config: FinancialEngineConfig,
): ObligationPressureResult {
  const mandatoryTotal = activeCommitments
    .filter(
      (c) =>
        MANDATORY_COMMITMENT_TYPES.has(c.commitmentType) &&
        c.status !== 'denied' &&
        c.status !== 'completed',
    )
    .reduce((sum, c) => sum + (c.confirmedAmount ?? c.amount ?? c.estimatedAmount ?? 0), 0);

  if (confirmedCycleIncome <= 0) {
    // No confirmed income to compare against: obligation pressure cannot be
    // assessed as a ratio. Treat conservatively as high pressure only if
    // there ARE mandatory obligations; otherwise normal.
    return { level: mandatoryTotal > 0 ? 'high' : 'normal', ratio: mandatoryTotal > 0 ? 1 : 0 };
  }

  const ratio = mandatoryTotal / confirmedCycleIncome;
  const level: ObligationPressureLevel =
    ratio >= config.highObligationPressureThreshold ? 'high' : 'normal';

  return { level, ratio };
}
