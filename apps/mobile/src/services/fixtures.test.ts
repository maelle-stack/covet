import {
  demoInsights,
  demoPurchaseCheckResponse,
  demoRecurring,
  demoSnapshot,
  demoTransactions,
  demoVaults,
} from './fixtures';

describe('demo fixtures', () => {
  it('mirrors the canonical Home reference: $316, YOU’RE GOOD, $50.00/day, 3 protected commitments', () => {
    expect(demoSnapshot.amount).toBe(316_00);
    expect(demoSnapshot.status).toBe('YOURE_GOOD');
    expect(demoSnapshot.dailyPace).toBe(50_00);
    const protectedCount =
      demoSnapshot.protectedHardCommitments.length +
      demoSnapshot.protectedSemiHardCommitments.length +
      demoSnapshot.protectedSoftCommitments.length;
    expect(protectedCount).toBe(3);
  });

  it('provides at least 25 transactions so the Insights gating can be exercised both ways', () => {
    expect(demoTransactions.length).toBeGreaterThanOrEqual(25);
    expect(demoInsights.length).toBeGreaterThan(0);
  });

  it('recurring covers bills AND habits, per the Recurring section requirements', () => {
    const types = new Set(demoRecurring.map((r) => r.recurringType));
    expect(types.has('bill')).toBe(true);
    expect(types.has('habit')).toBe(true);
  });

  it('the purchase check fixture carries a backend-authored decision, reason included', () => {
    expect(demoPurchaseCheckResponse.decision).toBe('wait');
    expect(demoPurchaseCheckResponse.decisionReason.length).toBeGreaterThan(0);
  });

  it('vault fixture only reduces Safe to Spend when actively protected', () => {
    for (const vault of demoVaults) {
      if (vault.status === 'active') expect(vault.activelyProtected).toBe(true);
    }
  });
});
