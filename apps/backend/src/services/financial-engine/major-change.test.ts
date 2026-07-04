import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import { detectMajorChangeFlags } from './major-change';
import type { SafeToSpendSnapshot } from '@covet/shared-types';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;

function makeSnapshot(overrides: Partial<SafeToSpendSnapshot> = {}): SafeToSpendSnapshot {
  return {
    id: 'snap-1',
    userId: 'user-1',
    amount: 200_00,
    payCycleStart: '2026-07-01',
    payCycleEnd: '2026-07-10',
    daysUntilNextIncome: 9,
    dailyPace: 22_00,
    internalProjectedPace: 22_00,
    status: 'YOURE_GOOD',
    confidenceScore: 90,
    externalConfidenceLabel: 'high',
    protectedHardCommitments: [],
    protectedSoftCommitments: [],
    debtPressureLevel: 'healthy',
    obligationPressureLevel: 'normal',
    emergencyFloorApplied: 20_00,
    behaviorBufferApplied: 10_00,
    majorChangeFlags: [],
    explanationSummary: '',
    lastCalculatedAt: '2026-07-01T00:00:00Z',
    staleAfter: '2026-07-01T06:00:00Z',
    inputsHash: 'hash-1',
    ...overrides,
  };
}

const baseInputs = {
  amount: 200_00,
  status: 'YOURE_GOOD' as const,
  payCycleStart: '2026-07-01',
  debtPressureLevel: 'healthy' as const,
  obligationPressureLevel: 'normal' as const,
  essentialAtRisk: false,
  softAtRisk: false,
};

describe('detectMajorChangeFlags', () => {
  it('produces no flags for the very first snapshot', () => {
    const flags = detectMajorChangeFlags({ ...baseInputs, previousSnapshot: null }, config);
    expect(flags).toEqual([]);
  });

  it('flags status_changed when status differs from the previous snapshot', () => {
    const previous = makeSnapshot({ status: 'TAKE_IT_EASY' });
    const flags = detectMajorChangeFlags({ ...baseInputs, previousSnapshot: previous }, config);
    expect(flags).toContain('status_changed');
  });

  it('flags material_increase for a >10% increase', () => {
    const previous = makeSnapshot({ amount: 100_00 });
    const flags = detectMajorChangeFlags(
      { ...baseInputs, amount: 200_00, previousSnapshot: previous },
      config,
    );
    expect(flags).toContain('material_increase');
  });

  it('flags material_decrease for a $25+ drop when previous was under $150', () => {
    const previous = makeSnapshot({ amount: 100_00 });
    const flags = detectMajorChangeFlags(
      { ...baseInputs, amount: 70_00, previousSnapshot: previous },
      config,
    );
    expect(flags).toContain('material_decrease');
  });

  it('does not flag a small decrease under $150 that is below the $25 threshold', () => {
    const previous = makeSnapshot({ amount: 100_00 });
    const flags = detectMajorChangeFlags(
      { ...baseInputs, amount: 90_00, previousSnapshot: previous },
      config,
    );
    expect(flags).not.toContain('material_decrease');
  });

  it('flags material_decrease for a $50+ drop when previous was >= $150', () => {
    const previous = makeSnapshot({ amount: 300_00 });
    const flags = detectMajorChangeFlags(
      { ...baseInputs, amount: 245_00, previousSnapshot: previous },
      config,
    );
    expect(flags).toContain('material_decrease');
  });

  it('flags income_landed when the new cycle starts at/after the previous cycle end', () => {
    const previous = makeSnapshot({ payCycleEnd: '2026-07-01' });
    const flags = detectMajorChangeFlags(
      { ...baseInputs, payCycleStart: '2026-07-01', previousSnapshot: previous },
      config,
    );
    expect(flags).toContain('income_landed');
  });

  it('flags commitment_at_risk whenever anything is at risk this cycle', () => {
    const flags = detectMajorChangeFlags(
      { ...baseInputs, essentialAtRisk: true, previousSnapshot: null },
      config,
    );
    expect(flags).toContain('commitment_at_risk');
  });

  it('flags commitment_covered when a previously at-risk situation is resolved', () => {
    const previous = makeSnapshot({ majorChangeFlags: ['commitment_at_risk'] });
    const flags = detectMajorChangeFlags(
      { ...baseInputs, essentialAtRisk: false, softAtRisk: false, previousSnapshot: previous },
      config,
    );
    expect(flags).toContain('commitment_covered');
  });

  it('flags debt_pressure_changed and obligation_pressure_changed on tier transitions', () => {
    const previous = makeSnapshot({
      debtPressureLevel: 'normal',
      obligationPressureLevel: 'normal',
    });
    const flags = detectMajorChangeFlags(
      {
        ...baseInputs,
        debtPressureLevel: 'high',
        obligationPressureLevel: 'high',
        previousSnapshot: previous,
      },
      config,
    );
    expect(flags).toContain('debt_pressure_changed');
    expect(flags).toContain('obligation_pressure_changed');
  });
});
