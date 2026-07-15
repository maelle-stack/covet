import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import { computeObligationPressure } from './obligation-pressure';
import { makeCommitment } from './test-helpers';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;

describe('computeObligationPressure', () => {
  it('is normal when mandatory obligations are well under 75% of income', () => {
    // High schooler: $500 income, ~$40 in subscriptions/obligations.
    const commitments = [
      makeCommitment({ commitmentType: 'subscription', hardness: 'hard', amount: 40_00 }),
    ];
    const result = computeObligationPressure(commitments, 500_00, config);
    expect(result.level).toBe('normal');
  });

  it('is high when mandatory obligations are >= 75% of income', () => {
    // Student: $500 income, $400 in rent + essential bills.
    const commitments = [
      makeCommitment({ commitmentType: 'rent', hardness: 'hard', amount: 300_00 }),
      makeCommitment({ commitmentType: 'essential_bill', hardness: 'hard', amount: 100_00 }),
    ];
    const result = computeObligationPressure(commitments, 500_00, config);
    expect(result.ratio).toBeCloseTo(0.8);
    expect(result.level).toBe('high');
  });

  it('does not count optional habits as mandatory', () => {
    const commitments = [
      makeCommitment({ commitmentType: 'habit', hardness: 'soft', amount: 400_00 }),
    ];
    const result = computeObligationPressure(commitments, 500_00, config);
    expect(result.level).toBe('normal');
    expect(result.ratio).toBe(0);
  });

  it('excludes denied and completed commitments', () => {
    const commitments = [
      makeCommitment({
        commitmentType: 'rent',
        hardness: 'hard',
        amount: 400_00,
        status: 'denied',
      }),
    ];
    const result = computeObligationPressure(commitments, 500_00, config);
    expect(result.ratio).toBe(0);
  });

  it('uses confirmedAmount over amount/estimatedAmount when present', () => {
    const commitments = [
      makeCommitment({
        commitmentType: 'rent',
        hardness: 'hard',
        amount: 100_00,
        confirmedAmount: 450_00,
      }),
    ];
    const result = computeObligationPressure(commitments, 500_00, config);
    expect(result.ratio).toBeCloseTo(0.9);
  });
});
