import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import { resolveSpendStatus } from './status';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;

const base = {
  amount: 500_00,
  daysUntilNextIncome: 10,
  essentialAtRisk: false,
  softAtRisk: false,
  debtPressureLevel: 'healthy' as const,
  obligationPressureLevel: 'normal' as const,
  emergencyFloorApplied: 50_00,
};

describe('resolveSpendStatus', () => {
  it('is YOURE_GOOD when everything is fine', () => {
    expect(resolveSpendStatus(base, config)).toBe('YOURE_GOOD');
  });

  it('is LETS_NOT whenever an essential (hard/semi-hard) commitment is at risk, even with positive amount', () => {
    expect(resolveSpendStatus({ ...base, essentialAtRisk: true }, config)).toBe('LETS_NOT');
  });

  it('is WAIT_UNTIL_PAYDAY when amount is non-positive but income lands soon', () => {
    expect(resolveSpendStatus({ ...base, amount: -50_00, daysUntilNextIncome: 2 }, config)).toBe(
      'WAIT_UNTIL_PAYDAY',
    );
  });

  it('is LETS_NOT when amount is non-positive and no income is coming soon', () => {
    expect(resolveSpendStatus({ ...base, amount: -50_00, daysUntilNextIncome: null }, config)).toBe(
      'LETS_NOT',
    );
    expect(resolveSpendStatus({ ...base, amount: -50_00, daysUntilNextIncome: 20 }, config)).toBe(
      'LETS_NOT',
    );
  });

  it('is LETS_NOT when debt pressure is critical, even with positive amount', () => {
    expect(resolveSpendStatus({ ...base, debtPressureLevel: 'critical' }, config)).toBe('LETS_NOT');
  });

  it('is TAKE_IT_EASY under HIGH_OBLIGATION_PRESSURE', () => {
    expect(resolveSpendStatus({ ...base, obligationPressureLevel: 'high' }, config)).toBe(
      'TAKE_IT_EASY',
    );
  });

  it('is TAKE_IT_EASY when a soft commitment is at risk', () => {
    expect(resolveSpendStatus({ ...base, softAtRisk: true }, config)).toBe('TAKE_IT_EASY');
  });

  it('is TAKE_IT_EASY when debt pressure is severe', () => {
    expect(resolveSpendStatus({ ...base, debtPressureLevel: 'severe' }, config)).toBe(
      'TAKE_IT_EASY',
    );
  });

  it('is TAKE_IT_EASY when Safe to Spend is thinner than the emergency floor', () => {
    expect(
      resolveSpendStatus({ ...base, amount: 10_00, emergencyFloorApplied: 50_00 }, config),
    ).toBe('TAKE_IT_EASY');
  });
});
