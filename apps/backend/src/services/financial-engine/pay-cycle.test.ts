import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import { computePayCycle } from './pay-cycle';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;
const now = new Date('2026-07-04T12:00:00Z');

describe('computePayCycle', () => {
  it('uses the confirmed next-income date when cadence is confirmed', () => {
    const result = computePayCycle(
      now,
      { type: 'biweekly', confirmed: true, nextExpectedAt: '2026-07-10T00:00:00Z' },
      config,
    );
    expect(result.payCycleStart).toBe('2026-07-04');
    expect(result.payCycleEnd).toBe('2026-07-10');
    expect(result.daysUntilNextIncome).toBe(6);
  });

  it('falls back to a conservative rolling 30-day window for irregular, unconfirmed income', () => {
    const result = computePayCycle(
      now,
      { type: 'irregular', confirmed: false, nextExpectedAt: null },
      config,
    );
    expect(result.payCycleStart).toBe('2026-07-04');
    expect(result.payCycleEnd).toBe('2026-08-03');
    expect(result.daysUntilNextIncome).toBeNull();
  });

  it('falls back to the rolling window when confirmed but no next date is known', () => {
    const result = computePayCycle(
      now,
      { type: 'irregular', confirmed: true, nextExpectedAt: null },
      config,
    );
    expect(result.daysUntilNextIncome).toBeNull();
  });
});
