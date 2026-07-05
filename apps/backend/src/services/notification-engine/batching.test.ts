import { batchEvents } from './batching';
import { eventBase, makeCommitment, makeSnapshot } from './test-helpers';
import type { CandidateEvent } from './types';

describe('batchEvents', () => {
  it('folds multiple money-state events into one unit led by the status change', () => {
    const decrease: CandidateEvent = {
      ...eventBase(),
      type: 'safe_to_spend_decrease',
      amountBefore: 350_00,
      amountAfter: 280_00,
      transactionTriggered: true,
      drivers: ['groceries', 'your phone bill'],
      snapshot: makeSnapshot({ amount: 280_00 }),
    };
    const statusChange: CandidateEvent = {
      ...eventBase(),
      type: 'status_change',
      statusBefore: 'YOURE_GOOD',
      statusAfter: 'TAKE_IT_EASY',
      snapshot: makeSnapshot({ amount: 280_00, status: 'TAKE_IT_EASY' }),
    };

    const units = batchEvents([decrease, statusChange]);
    expect(units).toHaveLength(1);
    expect(units[0]?.primary.type).toBe('status_change');
    expect(units[0]?.batched.map((e) => e.id)).toEqual([decrease.id]);
  });

  it('leads with the most recent money event when no status change is present', () => {
    const earlier: CandidateEvent = {
      ...eventBase(),
      occurredAt: '2026-07-04T15:00:00Z',
      type: 'safe_to_spend_decrease',
      amountBefore: 350_00,
      amountAfter: 300_00,
      transactionTriggered: true,
      drivers: ['groceries'],
      snapshot: makeSnapshot({ amount: 300_00 }),
    };
    const later: CandidateEvent = {
      ...eventBase(),
      occurredAt: '2026-07-04T16:00:00Z',
      type: 'safe_to_spend_decrease',
      amountBefore: 300_00,
      amountAfter: 280_00,
      transactionTriggered: true,
      drivers: ['your phone bill'],
      snapshot: makeSnapshot({ amount: 280_00 }),
    };

    const units = batchEvents([earlier, later]);
    expect(units).toHaveLength(1);
    expect(units[0]?.primary.id).toBe(later.id);
  });

  it('passes non-money events through as individual units', () => {
    const atRisk: CandidateEvent = {
      ...eventBase(),
      type: 'commitment_at_risk',
      commitment: makeCommitment(),
      worsenedSinceLastWarning: false,
    };
    const pause: CandidateEvent = {
      ...eventBase(),
      type: 'soft_commitment_pause',
      itemTitle: 'Brunch',
      relatedCommitmentId: null,
      resumeExpectation: 'in two weeks',
      worsenedSinceLastWarning: false,
    };

    const units = batchEvents([atRisk, pause]);
    expect(units).toHaveLength(2);
    expect(units.every((u) => u.batched.length === 0)).toBe(true);
  });
});
