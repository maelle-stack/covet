import type { BankConnectionStatus, ExternalConfidenceLabel } from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';
import { clamp } from './money';

export interface ConfidenceInputs {
  bankConnectionStatus: BankConnectionStatus;
  incomeCadenceConfirmed: boolean;
  calendarConnected: boolean;
  /** Fraction (0..1) of active commitments not yet user-confirmed. */
  unconfirmedCommitmentRatio: number;
  /** Pending debit total as a fraction (0..1+) of usable checking cash. */
  pendingCashRatio: number;
}

export interface ConfidenceResult {
  score: number;
  label: ExternalConfidenceLabel;
}

/**
 * Confidence scoring (docs/02_financial_engine.md): internal 0-100 score,
 * simplified externally to High / Medium / Still learning. Low confidence
 * must make the engine more conservative — callers use `label` to widen
 * buffers or soften claims, not to change the underlying arithmetic.
 */
export function computeConfidence(
  inputs: ConfidenceInputs,
  config: FinancialEngineConfig,
): ConfidenceResult {
  const p = config.confidencePenalties;
  let score = 100;

  if (inputs.bankConnectionStatus !== 'active') score -= p.bankNotActive;
  if (!inputs.incomeCadenceConfirmed) score -= p.incomeCadenceUnconfirmed;
  if (!inputs.calendarConnected) score -= p.calendarDisconnected;
  score -= clamp(inputs.unconfirmedCommitmentRatio, 0, 1) * p.unconfirmedCommitmentsMaxPenalty;
  score -= clamp(inputs.pendingCashRatio, 0, 1) * p.pendingCashRatioMaxPenalty;

  score = clamp(score, 0, 100);

  const label: ExternalConfidenceLabel =
    score >= config.confidenceLabelThresholds.high
      ? 'high'
      : score >= config.confidenceLabelThresholds.medium
        ? 'medium'
        : 'still_learning';

  return { score: Math.round(score), label };
}
