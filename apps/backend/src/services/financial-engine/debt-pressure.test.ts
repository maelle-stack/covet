import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import { computeDebtPressure } from './debt-pressure';
import { makeCreditAccount } from './test-helpers';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;
const cleanPayoffBehavior = { consecutiveOnTimeFullPayoffCycles: 0, minimumPaymentAtRisk: false };

describe('computeDebtPressure', () => {
  it.each([
    [0.05, 'healthy'],
    [0.2, 'normal'],
    [0.4, 'elevated'],
    [0.6, 'high'],
    [0.8, 'severe'],
    [0.95, 'critical'],
  ] as const)('classifies utilization %f as %s', (utilization, expectedLevel) => {
    const account = makeCreditAccount({
      creditLimit: 1000_00,
      currentBalance: Math.round(1000_00 * utilization),
    });
    const result = computeDebtPressure([account], cleanPayoffBehavior, config);
    expect(result.level).toBe(expectedLevel);
  });

  it('never lets credit availability increase the adjustment below zero', () => {
    const account = makeCreditAccount({ creditLimit: 1000_00, currentBalance: 0 });
    const result = computeDebtPressure([account], cleanPayoffBehavior, config);
    expect(result.adjustment).toBeGreaterThanOrEqual(0);
    expect(result.level).toBe('healthy');
  });

  it('ignores accounts without a credit limit', () => {
    const account = makeCreditAccount({ creditLimit: null, currentBalance: 500_00 });
    const result = computeDebtPressure([account], cleanPayoffBehavior, config);
    expect(result.utilization).toBe(0);
  });

  describe('trusted payoff adjustment', () => {
    const trustedPayoffBehavior = {
      consecutiveOnTimeFullPayoffCycles: 3,
      minimumPaymentAtRisk: false,
    };

    it('reduces the debt pressure penalty when eligible', () => {
      const account = makeCreditAccount({ creditLimit: 1000_00, currentBalance: 400_00 }); // elevated, 40%
      const withTrust = computeDebtPressure([account], trustedPayoffBehavior, config);
      const withoutTrust = computeDebtPressure([account], cleanPayoffBehavior, config);

      expect(withTrust.trustedPayoffApplied).toBe(true);
      expect(withTrust.adjustment).toBeLessThan(withoutTrust.adjustment);
    });

    it('does not apply at or above the max utilization threshold (50%)', () => {
      const account = makeCreditAccount({ creditLimit: 1000_00, currentBalance: 600_00 }); // 60%, 'high'
      const result = computeDebtPressure([account], trustedPayoffBehavior, config);
      expect(result.trustedPayoffApplied).toBe(false);
    });

    it('does not apply when a minimum payment is at risk', () => {
      const account = makeCreditAccount({ creditLimit: 1000_00, currentBalance: 200_00 });
      const result = computeDebtPressure(
        [account],
        { consecutiveOnTimeFullPayoffCycles: 5, minimumPaymentAtRisk: true },
        config,
      );
      expect(result.trustedPayoffApplied).toBe(false);
    });

    it('does not apply with fewer than 3 observed cycles', () => {
      const account = makeCreditAccount({ creditLimit: 1000_00, currentBalance: 200_00 });
      const result = computeDebtPressure(
        [account],
        { consecutiveOnTimeFullPayoffCycles: 2, minimumPaymentAtRisk: false },
        config,
      );
      expect(result.trustedPayoffApplied).toBe(false);
    });

    it('caps the improvement at one utilization tier', () => {
      // 'elevated' tier account: trusted payoff should never do better than
      // the 'normal' tier's rate, even though a raw 20% reduction might.
      const account = makeCreditAccount({ creditLimit: 1000_00, currentBalance: 450_00 }); // 45%, 'elevated'
      const result = computeDebtPressure([account], trustedPayoffBehavior, config);
      const normalTierRate = config.debtPressureAdjustmentRates.normal;
      const impliedRate = result.adjustment / 450_00;
      expect(impliedRate).toBeGreaterThanOrEqual(normalTierRate - 0.0001);
    });
  });
});
