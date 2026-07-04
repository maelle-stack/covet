import { computeBehaviorBuffer } from './behavior-buffer';
import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;

describe('computeBehaviorBuffer', () => {
  it('applies the approved archetype x strictness rate', () => {
    const result = computeBehaviorBuffer(1000_00, 'spontaneous', 'protective', 'normal', config);
    expect(result.rate).toBeCloseTo(0.22);
    expect(result.amount).toBe(Math.round(1000_00 * 0.22));
  });

  it('orders archetype buffers as approved: keeper < builder < drifter < giver < spontaneous', () => {
    const rateFor = (archetype: Parameters<typeof computeBehaviorBuffer>[1]) =>
      computeBehaviorBuffer(1000_00, archetype, 'balanced', 'normal', config).rate;

    expect(rateFor('keeper')).toBeLessThan(rateFor('builder'));
    expect(rateFor('builder')).toBeLessThan(rateFor('drifter'));
    expect(rateFor('drifter')).toBeLessThan(rateFor('giver'));
    expect(rateFor('giver')).toBeLessThan(rateFor('spontaneous'));
  });

  it('adds the HIGH_OBLIGATION_PRESSURE bonus on top of the base rate', () => {
    const normalPressure = computeBehaviorBuffer(1000_00, 'keeper', 'balanced', 'normal', config);
    const highPressure = computeBehaviorBuffer(1000_00, 'keeper', 'balanced', 'high', config);

    expect(highPressure.rate).toBeCloseTo(
      normalPressure.rate + config.highObligationPressureBufferBonus,
    );
  });

  it('never produces a negative amount for negative flexible cash', () => {
    const result = computeBehaviorBuffer(-500_00, 'spontaneous', 'protective', 'high', config);
    expect(result.amount).toBe(0);
  });
});
