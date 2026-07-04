import type { Cents } from '@covet/shared-types';

/** Round DOWN to whole dollars, expressed back in cents (never false precision). */
export function roundDownToDollar(amount: Cents): Cents {
  return Math.floor(amount / 100) * 100;
}

/** `amount * rate`, rounded to the nearest cent. Never introduces fractional cents. */
export function applyRate(amount: Cents, rate: number): Cents {
  return Math.round(amount * rate);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampCents(value: Cents, min: Cents, max: Cents): Cents {
  return Math.min(Math.max(value, min), max);
}
