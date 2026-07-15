import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import {
  buildProtectableItems,
  requiredNowFraction,
  resolveCommitmentStatus,
} from './protection-priority';
import { makeCommitment, makeRecurringItem } from './test-helpers';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;
const now = new Date('2026-07-04T00:00:00Z');

describe('buildProtectableItems', () => {
  it('orders rent/essential bills first, then debt minimums, then semi-hard, then soft', () => {
    const rent = makeCommitment({ commitmentType: 'rent', hardness: 'hard', title: 'Rent' });
    const debtMin = makeCommitment({
      commitmentType: 'debt_minimum',
      hardness: 'hard',
      title: 'Card minimum',
    });
    const semiHard = makeCommitment({ hardness: 'semi_hard', title: 'Birthday dinner' });
    const soft = makeCommitment({ hardness: 'soft', title: 'Brunch' });

    const items = buildProtectableItems([soft, semiHard, debtMin, rent], []);
    expect(items.map((i) => i.title)).toEqual([
      'Rent',
      'Card minimum',
      'Birthday dinner',
      'Brunch',
    ]);
  });

  it('excludes candidate, denied, and completed commitments from allocation', () => {
    const candidate = makeCommitment({ status: 'candidate' });
    const denied = makeCommitment({ status: 'denied' });
    const completed = makeCommitment({ status: 'completed' });
    const paused = makeCommitment({ status: 'paused' });
    const active = makeCommitment({ status: 'protected', title: 'Active' });

    const items = buildProtectableItems([candidate, denied, completed, paused, active], []);
    expect(items.map((i) => i.title)).toEqual(['Active']);
  });

  it('excludes recurring items linked to a commitment, to avoid double-protecting', () => {
    const recurring = makeRecurringItem({ id: 'r1', title: 'Rent (recurring)' });
    const commitment = makeCommitment({ linkedRecurringItemId: 'r1' });
    const items = buildProtectableItems([commitment], [recurring]);
    expect(items.some((i) => i.id === 'r1')).toBe(false);
  });

  it('excludes unconfirmed, paused, or zero-amount recurring items', () => {
    const detected = makeRecurringItem({ status: 'detected' });
    const paused = makeRecurringItem({ userPaused: true });
    const zeroAmount = makeRecurringItem({ amountEstimate: 0 });
    const valid = makeRecurringItem({ title: 'Valid habit' });

    const items = buildProtectableItems([], [detected, paused, zeroAmount, valid]);
    expect(items.map((i) => i.title)).toEqual(['Valid habit']);
  });

  it('treats a hard recurring bill with the same priority as rent/essential bills', () => {
    const hardBill = makeRecurringItem({
      recurringType: 'bill',
      hardness: 'hard',
      title: 'Phone bill',
    });
    const rent = makeCommitment({ commitmentType: 'rent', hardness: 'hard', title: 'Rent' });
    const items = buildProtectableItems([rent], [hardBill]);
    expect(items.every((i) => i.subrank === 0)).toBe(true);
  });
});

describe('requiredNowFraction', () => {
  it('is always 1 for a commitment with no due date', () => {
    expect(requiredNowFraction({ dueAt: null, hardness: 'soft' }, now, 'balanced', config)).toBe(1);
  });

  it('is 1 when the due date has passed', () => {
    expect(
      requiredNowFraction(
        { dueAt: '2026-07-01T00:00:00Z', hardness: 'hard' },
        now,
        'balanced',
        config,
      ),
    ).toBe(1);
  });

  it('is 0 when the due date is outside the protection window', () => {
    expect(
      requiredNowFraction(
        { dueAt: '2026-08-04T00:00:00Z', hardness: 'hard' },
        now,
        'balanced',
        config,
      ),
    ).toBe(0);
  });

  it('ramps linearly inside the protection window', () => {
    // hard/balanced window = 14 days; due in 7 days = halfway through the ramp.
    const fraction = requiredNowFraction(
      { dueAt: '2026-07-11T00:00:00Z', hardness: 'hard' },
      now,
      'balanced',
      config,
    );
    expect(fraction).toBeCloseTo(0.5, 1);
  });

  it('protective strictness starts protecting earlier than light', () => {
    const dueAt = '2026-07-14T00:00:00Z'; // 10 days out
    const light = requiredNowFraction({ dueAt, hardness: 'hard' }, now, 'light', config);
    const protective = requiredNowFraction({ dueAt, hardness: 'hard' }, now, 'protective', config);
    expect(protective).toBeGreaterThan(light);
  });
});

describe('resolveCommitmentStatus', () => {
  it('is protected when fully covered', () => {
    expect(resolveCommitmentStatus(100_00, 100_00, null, now, config)).toBe('protected');
  });

  it('is partial when something but not everything is reserved', () => {
    expect(resolveCommitmentStatus(100_00, 40_00, null, now, config)).toBe('partial');
  });

  it('is at_risk when nothing is reserved and the due date is close', () => {
    expect(resolveCommitmentStatus(100_00, 0, '2026-07-05T00:00:00Z', now, config)).toBe('at_risk');
  });

  it('is protected (not yet urgent) when nothing is reserved but the due date is far off', () => {
    expect(resolveCommitmentStatus(100_00, 0, '2026-09-01T00:00:00Z', now, config)).toBe(
      'protected',
    );
  });
});
