import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import { computePendingIncomeAdjustment } from './pending-income';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;
const now = new Date('2026-07-04T12:00:00Z');
const confirmedCadence = { type: 'biweekly' as const, confirmed: true, nextExpectedAt: null };

describe('computePendingIncomeAdjustment', () => {
  it('applies the lesser of 15% of the deposit or the $100 cap', () => {
    const smallDeposit = {
      expectedAmount: 200_00,
      expectedAt: '2026-07-05T12:00:00Z', // 24h out
      confidence: 'high' as const,
    };
    // 15% of $200 = $30, well under the $100 cap.
    expect(computePendingIncomeAdjustment(smallDeposit, confirmedCadence, now, config)).toBe(30_00);

    const largeDeposit = {
      expectedAmount: 2000_00,
      expectedAt: '2026-07-05T12:00:00Z',
      confidence: 'high' as const,
    };
    // 15% of $2000 = $300, capped at $100.
    expect(computePendingIncomeAdjustment(largeDeposit, confirmedCadence, now, config)).toBe(
      100_00,
    );
  });

  it('returns 0 when there is no pending income', () => {
    expect(computePendingIncomeAdjustment(null, confirmedCadence, now, config)).toBe(0);
  });

  it('returns 0 when income cadence is unconfirmed', () => {
    const deposit = {
      expectedAmount: 200_00,
      expectedAt: '2026-07-05T12:00:00Z',
      confidence: 'high' as const,
    };
    expect(
      computePendingIncomeAdjustment(
        deposit,
        { ...confirmedCadence, confirmed: false },
        now,
        config,
      ),
    ).toBe(0);
  });

  it('returns 0 when confidence is not high', () => {
    const deposit = {
      expectedAmount: 200_00,
      expectedAt: '2026-07-05T12:00:00Z',
      confidence: 'medium' as const,
    };
    expect(computePendingIncomeAdjustment(deposit, confirmedCadence, now, config)).toBe(0);
  });

  it('returns 0 when the deposit is more than 72 hours out', () => {
    const deposit = {
      expectedAmount: 200_00,
      expectedAt: '2026-07-10T12:00:00Z',
      confidence: 'high' as const,
    };
    expect(computePendingIncomeAdjustment(deposit, confirmedCadence, now, config)).toBe(0);
  });

  it('returns 0 when the deposit is already in the past', () => {
    const deposit = {
      expectedAmount: 200_00,
      expectedAt: '2026-07-01T12:00:00Z',
      confidence: 'high' as const,
    };
    expect(computePendingIncomeAdjustment(deposit, confirmedCadence, now, config)).toBe(0);
  });
});
