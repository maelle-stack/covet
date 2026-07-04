import type { Cents } from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';
import { applyRate, clampCents } from './money';
import type { IncomeCadenceInput, PendingIncomeInput } from './types';

/**
 * Pending-income adjustment (docs/02_financial_engine.md): a small,
 * capped, conservative bump — never full cash treatment. Applies ONLY
 * when cadence is confirmed, confidence is high, the deposit lands within
 * the configured window (default 72h), and never to fund a hard
 * commitment due before the deposit lands (enforced by the caller, which
 * must not count this adjustment toward hard-commitment protection).
 */
export function computePendingIncomeAdjustment(
  pendingIncome: PendingIncomeInput | null,
  incomeCadence: IncomeCadenceInput,
  now: Date,
  config: FinancialEngineConfig,
): Cents {
  if (!pendingIncome) return 0;
  if (!incomeCadence.confirmed) return 0;
  if (pendingIncome.confidence !== 'high') return 0;

  const hoursUntil =
    (new Date(pendingIncome.expectedAt).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < 0 || hoursUntil > config.pendingIncomeMaxHoursOut) return 0;

  const rateCap = applyRate(pendingIncome.expectedAmount, config.pendingIncomeCapRate);
  return clampCents(
    Math.min(rateCap, config.pendingIncomeCapAmountCents),
    0,
    pendingIncome.expectedAmount,
  );
}
