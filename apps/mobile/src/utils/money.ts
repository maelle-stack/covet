import type { Cents } from '@covet/shared-types';

/**
 * Display formatting only — the engine already rounds Safe to Spend down;
 * the UI must never re-derive or "fix" amounts.
 */
export function formatWholeDollars(amount: Cents): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.floor(Math.abs(amount) / 100)}`;
}

/** "$50.00" style, for the daily pace line ("$50.00/day until mm/dd"). */
export function formatDollarsAndCents(amount: Cents): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const dollars = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, '0');
  return `${sign}$${dollars}.${cents}`;
}
