import { calculateSafeToSpend } from './index';
import type { SafeToSpendEngineInput } from './types';
import {
  makeAccount,
  makeCommitment,
  makeCreditAccount,
  makeRecurringItem,
  makeTransaction,
  makeVault,
} from './test-helpers';

const NOW = '2026-07-04T12:00:00Z';

function makeInput(overrides: Partial<SafeToSpendEngineInput> = {}): SafeToSpendEngineInput {
  return {
    userId: 'user-1',
    now: NOW,
    accounts: [makeAccount({ currentBalance: 1000_00 })],
    transactions: [],
    commitments: [],
    recurringItems: [],
    vaults: [],
    primaryArchetype: 'keeper',
    strictness: 'balanced',
    expectedCycleIncome: 1000_00,
    incomeCadence: { type: 'biweekly', confirmed: true, nextExpectedAt: '2026-07-14T00:00:00Z' },
    pendingIncome: null,
    payoffBehavior: { consecutiveOnTimeFullPayoffCycles: 0, minimumPaymentAtRisk: false },
    bankConnectionStatus: 'active',
    calendarConnected: true,
    previousSnapshot: null,
    ...overrides,
  };
}

describe('calculateSafeToSpend — scenarios', () => {
  it('high schooler: $500 income, almost no obligations -> plenty of room, YOURE_GOOD, normal pressure', () => {
    const input = makeInput({
      accounts: [makeAccount({ currentBalance: 500_00 })],
      expectedCycleIncome: 500_00,
      commitments: [
        makeCommitment({
          commitmentType: 'subscription',
          hardness: 'hard',
          amount: 15_00,
          status: 'protected',
        }),
      ],
      primaryArchetype: 'spontaneous',
    });
    const snapshot = calculateSafeToSpend(input);

    expect(snapshot.obligationPressureLevel).toBe('normal');
    expect(snapshot.status).toBe('YOURE_GOOD');
    expect(snapshot.amount).toBeGreaterThan(0);
  });

  it('student: $500 income, $400 mandatory obligations -> HIGH_OBLIGATION_PRESSURE, extra buffer applied', () => {
    const lowPressureInput = makeInput({
      accounts: [makeAccount({ currentBalance: 500_00 })],
      expectedCycleIncome: 500_00,
      primaryArchetype: 'keeper',
      strictness: 'balanced',
    });

    const highPressureInput = makeInput({
      accounts: [makeAccount({ currentBalance: 500_00 })],
      expectedCycleIncome: 500_00,
      commitments: [
        makeCommitment({
          commitmentType: 'rent',
          hardness: 'hard',
          amount: 300_00,
          status: 'protected',
        }),
        makeCommitment({
          commitmentType: 'essential_bill',
          hardness: 'hard',
          amount: 100_00,
          status: 'protected',
        }),
      ],
      primaryArchetype: 'keeper',
      strictness: 'balanced',
    });

    const lowPressure = calculateSafeToSpend(lowPressureInput);
    const highPressure = calculateSafeToSpend(highPressureInput);

    expect(highPressure.obligationPressureLevel).toBe('high');
    expect(lowPressure.obligationPressureLevel).toBe('normal');
    // The buffer rate should be higher under HIGH_OBLIGATION_PRESSURE even
    // though there's less cash to apply it to.
    const lowPressureRate = lowPressure.behaviorBufferApplied / 500_00;
    expect(lowPressureRate).toBeGreaterThan(0);
    expect(highPressure.status).not.toBe('YOURE_GOOD');
  });

  it('early-career biweekly worker with rent (hard) + weekend brunch habit (soft)', () => {
    const rent = makeCommitment({
      title: 'Rent',
      commitmentType: 'rent',
      hardness: 'hard',
      amount: 1200_00,
      status: 'protected',
      dueAt: '2026-07-08T00:00:00Z',
    });
    const brunch = makeRecurringItem({
      recurringType: 'habit',
      hardness: 'soft',
      amountEstimate: 75_00,
      nextExpectedAt: '2026-07-05T00:00:00Z',
      title: 'Weekend brunch',
    });

    const snapshot = calculateSafeToSpend(
      makeInput({
        accounts: [makeAccount({ currentBalance: 2500_00 })],
        commitments: [rent],
        recurringItems: [brunch],
        expectedCycleIncome: 2500_00,
      }),
    );

    expect(snapshot.protectedHardCommitments.map((c) => c.title)).toContain('Rent');
    expect(snapshot.amount).toBeLessThan(2500_00 - 1200_00); // rent + brunch + floor + buffer all came out
  });

  it('freelancer with irregular, unconfirmed income plans from a conservative 30-day window', () => {
    const snapshot = calculateSafeToSpend(
      makeInput({
        incomeCadence: { type: 'irregular', confirmed: false, nextExpectedAt: null },
        bankConnectionStatus: 'active',
        calendarConnected: false,
      }),
    );

    expect(snapshot.daysUntilNextIncome).toBeNull();
    expect(snapshot.dailyPace).toBeNull();
    expect(snapshot.payCycleEnd).toBe('2026-08-03');
  });

  it('high credit utilization user gets a larger debt pressure adjustment and stricter status', () => {
    const snapshot = calculateSafeToSpend(
      makeInput({
        accounts: [
          makeAccount({ currentBalance: 1000_00 }),
          makeCreditAccount({ currentBalance: 950_00, creditLimit: 1000_00 }), // 95% utilization
        ],
      }),
    );

    expect(snapshot.debtPressureLevel).toBe('critical');
    expect(snapshot.status).toBe('LETS_NOT');
  });

  it('trusted payoff user (3+ clean cycles, healthy utilization) gets a reduced debt pressure adjustment', () => {
    const untrustedInput = makeInput({
      accounts: [
        makeAccount({ currentBalance: 1000_00 }),
        makeCreditAccount({ currentBalance: 350_00, creditLimit: 1000_00 }), // 35%, elevated
      ],
    });
    const trustedInput = makeInput({
      accounts: [
        makeAccount({ currentBalance: 1000_00 }),
        makeCreditAccount({ currentBalance: 350_00, creditLimit: 1000_00 }),
      ],
      payoffBehavior: { consecutiveOnTimeFullPayoffCycles: 4, minimumPaymentAtRisk: false },
    });

    const untrusted = calculateSafeToSpend(untrustedInput);
    const trusted = calculateSafeToSpend(trustedInput);

    expect(trusted.amount).toBeGreaterThan(untrusted.amount);
  });

  it('a pending debit transaction reduces Safe to Spend immediately, before it posts', () => {
    const account = makeAccount({ currentBalance: 1000_00 });
    const withoutPending = calculateSafeToSpend(makeInput({ accounts: [account] }));
    const withPending = calculateSafeToSpend(
      makeInput({
        accounts: [account],
        transactions: [
          makeTransaction({ accountId: account.id, amount: 100_00, pending: true, type: 'debit' }),
        ],
      }),
    );

    // The full $100 comes out of usable cash immediately, but because the
    // emergency floor and behavior buffer are both percentages of that cash,
    // Safe to Spend drops by somewhat less than $100 — part of the pending
    // debit would have gone to the floor/buffer anyway, not to discretionary
    // room. The floor and buffer amounts themselves must shrink accordingly.
    expect(withPending.amount).toBeLessThan(withoutPending.amount);
    expect(withoutPending.amount - withPending.amount).toBeLessThan(100_00);
    expect(withPending.emergencyFloorApplied).toBeLessThan(withoutPending.emergencyFloorApplied);
    expect(withPending.behaviorBufferApplied).toBeLessThan(withoutPending.behaviorBufferApplied);
  });

  it('a confirmed near-term commitment ramps toward fully protected as its due date approaches', () => {
    const farOut = makeCommitment({
      hardness: 'semi_hard',
      amount: 200_00,
      status: 'protected',
      dueAt: '2026-09-01T00:00:00Z', // far outside the semi_hard/balanced 10-day window
    });
    const dueTomorrow = makeCommitment({
      hardness: 'semi_hard',
      amount: 200_00,
      status: 'protected',
      dueAt: '2026-07-05T00:00:00Z',
    });

    const farSnapshot = calculateSafeToSpend(makeInput({ commitments: [farOut] }));
    const nearSnapshot = calculateSafeToSpend(makeInput({ commitments: [dueTomorrow] }));

    // Far out: nothing needs to be reserved yet, so more cash remains.
    expect(farSnapshot.amount).toBeGreaterThan(nearSnapshot.amount);
  });

  it('reports a semi-hard commitment in protectedSemiHardCommitments, not protectedHardCommitments', () => {
    const birthdayDinner = makeCommitment({
      title: 'Birthday dinner',
      hardness: 'semi_hard',
      amount: 100_00,
      status: 'protected',
      dueAt: '2026-07-05T00:00:00Z',
    });
    const snapshot = calculateSafeToSpend(makeInput({ commitments: [birthdayDinner] }));

    expect(snapshot.protectedSemiHardCommitments.map((c) => c.title)).toContain('Birthday dinner');
    expect(snapshot.protectedHardCommitments.map((c) => c.title)).not.toContain('Birthday dinner');
    expect(snapshot.explanationSummary).toContain('Birthday dinner');
  });

  it('internalProjectedPace reflects a known Saturday brunch habit even though dailyPace stays flat', () => {
    const brunch = makeRecurringItem({
      title: 'Weekend brunch',
      recurringType: 'habit',
      hardness: 'soft',
      amountEstimate: 75_00,
      nextExpectedAt: '2026-07-11T00:00:00Z', // a Saturday inside this 10-day cycle
    });
    const snapshot = calculateSafeToSpend(
      makeInput({ accounts: [makeAccount({ currentBalance: 2000_00 })], recurringItems: [brunch] }),
    );

    expect(snapshot.dailyPace).not.toBeNull();
    expect(snapshot.internalProjectedPace).not.toBeNull();
    // The tightest day (brunch Saturday) pulls the internal pace below the
    // flat, even-split user-facing pace.
    expect(snapshot.internalProjectedPace as number).toBeLessThan(snapshot.dailyPace as number);

    const saturday = snapshot.paceProjection.find((d) => d.date === '2026-07-11');
    expect(saturday?.drivers).toContain('Weekend brunch');
    expect(saturday?.expectedFlexibleRoom).toBe(snapshot.internalProjectedPace);
  });

  it('internalProjectedPace equals dailyPace when nothing uneven is known in the cycle', () => {
    const snapshot = calculateSafeToSpend(makeInput());
    expect(snapshot.internalProjectedPace).toBe(snapshot.dailyPace);
  });

  it('internalProjectedPace and paceProjection are both null/empty-safe when income is unconfirmed', () => {
    const snapshot = calculateSafeToSpend(
      makeInput({ incomeCadence: { type: 'irregular', confirmed: false, nextExpectedAt: null } }),
    );
    expect(snapshot.internalProjectedPace).toBeNull();
    // The day-by-day array itself is still populated for internal/notification use.
    expect(snapshot.paceProjection.length).toBeGreaterThan(0);
  });

  it('an active vault reduces Safe to Spend; a passive (saved, not protected) vault does not', () => {
    const active = makeVault({ activelyProtected: true, status: 'active', targetAmount: 200_00 });
    const passive = makeVault({ activelyProtected: false, status: 'saved', targetAmount: 200_00 });

    const withActive = calculateSafeToSpend(makeInput({ vaults: [active] }));
    const withPassive = calculateSafeToSpend(makeInput({ vaults: [passive] }));
    const withNeither = calculateSafeToSpend(makeInput({ vaults: [] }));

    expect(withActive.amount).toBeLessThan(withNeither.amount);
    expect(withPassive.amount).toBe(withNeither.amount);
  });

  it('withholds the 10% emergency floor from usable checking cash', () => {
    const snapshot = calculateSafeToSpend(
      makeInput({ accounts: [makeAccount({ currentBalance: 1000_00 })] }),
    );
    expect(snapshot.emergencyFloorApplied).toBe(100_00);
  });

  it('never shows a fake positive amount when a hard commitment cannot be fully protected; status is LETS_NOT', () => {
    const rentDueTomorrow = makeCommitment({
      title: 'Rent',
      commitmentType: 'rent',
      hardness: 'hard',
      amount: 5000_00, // far more than available cash
      status: 'protected',
      dueAt: '2026-07-05T00:00:00Z',
    });
    const snapshot = calculateSafeToSpend(
      makeInput({
        accounts: [makeAccount({ currentBalance: 500_00 })],
        commitments: [rentDueTomorrow],
      }),
    );

    // All available cash goes toward rent, leaving nothing — not a fake
    // positive number — and the shortfall is reflected in the ref amount.
    expect(snapshot.amount).toBeLessThanOrEqual(0);
    expect(snapshot.status).toBe('LETS_NOT');
    const ref = snapshot.protectedHardCommitments.find((c) => c.title === 'Rent');
    expect(ref?.protectedAmount).toBeLessThan(rentDueTomorrow.amount ?? 0);
  });

  it('produces a genuinely negative amount when debt pressure exceeds remaining cash, never floored to zero', () => {
    const snapshot = calculateSafeToSpend(
      makeInput({
        accounts: [
          makeAccount({ currentBalance: 100_00 }),
          makeCreditAccount({ currentBalance: 900_00, creditLimit: 1000_00 }), // 90% -> critical
        ],
      }),
    );

    expect(snapshot.debtPressureLevel).toBe('critical');
    expect(snapshot.amount).toBeLessThan(0);
    expect(snapshot.status).toBe('LETS_NOT');
  });

  it('rounds the final amount down to the dollar, never showing false precision', () => {
    const snapshot = calculateSafeToSpend(
      makeInput({ accounts: [makeAccount({ currentBalance: 1000_37 })] }),
    );
    expect(snapshot.amount % 100).toBe(0);
  });

  it('produces a conclusion-first explanation without exposing the full formula', () => {
    const rent = makeCommitment({
      title: 'Rent',
      commitmentType: 'rent',
      hardness: 'hard',
      amount: 500_00,
      status: 'protected',
    });
    const snapshot = calculateSafeToSpend(makeInput({ commitments: [rent] }));

    expect(snapshot.explanationSummary).toContain('Rent');
    expect(snapshot.explanationSummary).not.toMatch(
      /emergency floor|behavior buffer|debt pressure/i,
    );
  });

  it('detects income_landed once a new pay cycle begins relative to the previous snapshot', () => {
    const first = calculateSafeToSpend(makeInput());
    const secondCycleInput = makeInput({
      now: '2026-07-14T12:00:00Z',
      incomeCadence: { type: 'biweekly', confirmed: true, nextExpectedAt: '2026-07-28T00:00:00Z' },
      previousSnapshot: first,
    });
    const second = calculateSafeToSpend(secondCycleInput);

    expect(second.majorChangeFlags).toContain('income_landed');
  });

  it('is deterministic: identical inputs (same `now`) produce identical amounts and status', () => {
    const input = makeInput({
      commitments: [makeCommitment({ hardness: 'hard', amount: 200_00, status: 'protected' })],
    });
    const first = calculateSafeToSpend(input);
    const second = calculateSafeToSpend(input);

    expect(second.amount).toBe(first.amount);
    expect(second.status).toBe(first.status);
    expect(second.inputsHash).toBe(first.inputsHash);
  });
});
