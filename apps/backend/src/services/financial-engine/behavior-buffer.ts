import type {
  Archetype,
  Cents,
  ObligationPressureLevel,
  StrictnessLevel,
} from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';
import { applyRate } from './money';

export interface BehaviorBufferResult {
  /** Resolved rate actually applied (archetype x strictness, plus HIGH_OBLIGATION_PRESSURE bonus if active). */
  rate: number;
  amount: Cents;
}

/**
 * Behavior buffer (docs/02_financial_engine.md): a percentage of flexible
 * discretionary cash — what remains after the emergency floor, hard
 * commitments, debt minimums, and recurring bills/habits are protected.
 * v1 uses only the primary archetype; observed-behavior adjustment is a
 * future refinement, not implemented here.
 */
export function computeBehaviorBuffer(
  flexibleDiscretionaryCash: Cents,
  archetype: Archetype,
  strictness: StrictnessLevel,
  obligationPressureLevel: ObligationPressureLevel,
  config: FinancialEngineConfig,
): BehaviorBufferResult {
  const baseRate = config.behaviorBufferRates[archetype][strictness];
  const rate =
    obligationPressureLevel === 'high'
      ? baseRate + config.highObligationPressureBufferBonus
      : baseRate;

  const amount = Math.max(0, applyRate(Math.max(flexibleDiscretionaryCash, 0), rate));

  return { rate, amount };
}
