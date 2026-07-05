import { DEFAULT_FINANCIAL_ENGINE_CONFIG } from './config';
import { buildPaceProjection, type PaceProjectionSourceItem } from './pace-projection';

const config = DEFAULT_FINANCIAL_ENGINE_CONFIG;

describe('buildPaceProjection', () => {
  it('produces one entry per day in the cycle with a flat baseDailyPace', () => {
    const days = buildPaceProjection('2026-07-01', '2026-07-05', 400_00, [], config);
    expect(days).toHaveLength(4);
    expect(days.every((d) => d.baseDailyPace === 100_00)).toBe(true);
    expect(days.map((d) => d.date)).toEqual([
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
    ]);
  });

  it('reduces expectedFlexibleRoom on a day with a known soft habit due, leaving other days untouched', () => {
    const brunch: PaceProjectionSourceItem = {
      title: 'Weekend brunch',
      hardness: 'soft',
      dueAt: '2026-07-04T00:00:00Z',
      expectedAmount: 75_00,
      isAtRisk: false,
    };
    const days = buildPaceProjection('2026-07-01', '2026-07-05', 400_00, [brunch], config);

    const saturday = days.find((d) => d.date === '2026-07-04')!;
    const otherDay = days.find((d) => d.date === '2026-07-01')!;

    expect(saturday.protectedSoftDue).toBe(75_00);
    expect(saturday.expectedFlexibleRoom).toBe(saturday.baseDailyPace - 75_00);
    expect(saturday.drivers).toContain('Weekend brunch');
    expect(otherDay.expectedFlexibleRoom).toBe(otherDay.baseDailyPace);
    expect(otherDay.drivers).toEqual([]);
  });

  it('never lets expectedFlexibleRoom go negative even when due amounts exceed the base pace', () => {
    const birthdayDinner: PaceProjectionSourceItem = {
      title: 'Birthday dinner',
      hardness: 'semi_hard',
      dueAt: '2026-07-03T00:00:00Z',
      expectedAmount: 500_00, // far more than one day's flat share
      isAtRisk: false,
    };
    const days = buildPaceProjection('2026-07-01', '2026-07-05', 400_00, [birthdayDinner], config);
    const day = days.find((d) => d.date === '2026-07-03')!;
    expect(day.expectedFlexibleRoom).toBe(0);
  });

  it('marks a day high risk when an essential (hard/semi-hard) item due that day is at_risk', () => {
    const atRiskBill: PaceProjectionSourceItem = {
      title: 'Phone bill',
      hardness: 'hard',
      dueAt: '2026-07-02T00:00:00Z',
      expectedAmount: 0,
      isAtRisk: true,
    };
    const days = buildPaceProjection('2026-07-01', '2026-07-05', 400_00, [atRiskBill], config);
    const day = days.find((d) => d.date === '2026-07-02')!;
    expect(day.riskLevel).toBe('high');
  });

  it('does not elevate risk from an at-risk soft item alone', () => {
    const atRiskHabit: PaceProjectionSourceItem = {
      title: 'Pilates',
      hardness: 'soft',
      dueAt: '2026-07-02T00:00:00Z',
      expectedAmount: 0,
      isAtRisk: true,
    };
    const days = buildPaceProjection('2026-07-01', '2026-07-05', 400_00, [atRiskHabit], config);
    const day = days.find((d) => d.date === '2026-07-02')!;
    expect(day.riskLevel).not.toBe('high');
  });

  it('ignores items with no due date and items due outside the cycle', () => {
    const undated: PaceProjectionSourceItem = {
      title: 'Ongoing goal',
      hardness: 'soft',
      dueAt: null,
      expectedAmount: 100_00,
      isAtRisk: false,
    };
    const outsideCycle: PaceProjectionSourceItem = {
      title: 'Next month bill',
      hardness: 'hard',
      dueAt: '2026-09-01T00:00:00Z',
      expectedAmount: 100_00,
      isAtRisk: false,
    };
    const days = buildPaceProjection(
      '2026-07-01',
      '2026-07-05',
      400_00,
      [undated, outsideCycle],
      config,
    );
    expect(days.every((d) => d.drivers.length === 0)).toBe(true);
  });

  it('caps the projection length at maxPaceProjectionDays', () => {
    const days = buildPaceProjection('2026-07-01', '2027-07-01', 36500_00, [], config);
    expect(days.length).toBeLessThanOrEqual(config.maxPaceProjectionDays);
  });
});
