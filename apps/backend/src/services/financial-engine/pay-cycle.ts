import type { ISODateString } from '@covet/shared-types';

import type { FinancialEngineConfig } from './config';
import type { IncomeCadenceInput } from './types';

export interface PayCycleResult {
  payCycleStart: ISODateString;
  payCycleEnd: ISODateString;
  /** Null whenever income is irregular/unconfirmed (docs/02_financial_engine.md). */
  daysUntilNextIncome: number | null;
}

function toISODate(date: Date): ISODateString {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/**
 * The pay cycle runs from now until the next confirmed/expected income
 * event. When income is irregular and unconfirmed, the engine falls back
 * to a conservative rolling planning window rather than assuming a stable
 * cadence (docs/02_financial_engine.md).
 */
export function computePayCycle(
  now: Date,
  incomeCadence: IncomeCadenceInput,
  config: FinancialEngineConfig,
): PayCycleResult {
  if (incomeCadence.confirmed && incomeCadence.nextExpectedAt) {
    const nextIncome = new Date(incomeCadence.nextExpectedAt);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntil = Math.max(0, Math.ceil((nextIncome.getTime() - now.getTime()) / msPerDay));
    return {
      payCycleStart: toISODate(now),
      payCycleEnd: toISODate(nextIncome),
      daysUntilNextIncome: daysUntil,
    };
  }

  return {
    payCycleStart: toISODate(now),
    payCycleEnd: toISODate(addDays(now, config.irregularIncomePlanningWindowDays)),
    daysUntilNextIncome: null,
  };
}
