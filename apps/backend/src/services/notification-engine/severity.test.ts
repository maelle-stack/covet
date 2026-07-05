import { resolveSeverity } from './severity';
import { eventBase, makeCommitment, makePattern, makeSnapshot } from './test-helpers';

describe('resolveSeverity', () => {
  it('worsening status is a nudge; improving status is a note', () => {
    expect(
      resolveSeverity({
        ...eventBase(),
        type: 'status_change',
        statusBefore: 'YOURE_GOOD',
        statusAfter: 'TAKE_IT_EASY',
        snapshot: makeSnapshot(),
      }),
    ).toBe('nudge');

    expect(
      resolveSeverity({
        ...eventBase(),
        type: 'status_change',
        statusBefore: 'TAKE_IT_EASY',
        statusAfter: 'YOURE_GOOD',
        snapshot: makeSnapshot(),
      }),
    ).toBe('note');
  });

  it('hard/semi-hard commitment at risk is protect; soft is a nudge', () => {
    expect(
      resolveSeverity({
        ...eventBase(),
        type: 'commitment_at_risk',
        commitment: makeCommitment({ hardness: 'hard' }),
        worsenedSinceLastWarning: false,
      }),
    ).toBe('protect');

    expect(
      resolveSeverity({
        ...eventBase(),
        type: 'commitment_at_risk',
        commitment: makeCommitment({ hardness: 'soft', commitmentType: 'habit' }),
        worsenedSinceLastWarning: false,
      }),
    ).toBe('nudge');
  });

  it('bank disconnect is protect; calendar disconnect is review', () => {
    expect(
      resolveSeverity({
        ...eventBase(),
        type: 'connection_health',
        provider: 'bank',
        affectsPlanning: true,
      }),
    ).toBe('protect');
    expect(
      resolveSeverity({
        ...eventBase(),
        type: 'connection_health',
        provider: 'calendar',
        affectsPlanning: true,
      }),
    ).toBe('review');
  });

  it('security events are protect', () => {
    expect(resolveSeverity({ ...eventBase(), type: 'security', summary: 'new device' })).toBe(
      'protect',
    );
  });

  it('pattern and calendar confirmations are review', () => {
    expect(
      resolveSeverity({
        ...eventBase(),
        type: 'pattern_confirmation',
        pattern: makePattern(),
        materiallyAffectsCurrentCycle: true,
        linkedRecurringItem: null,
      }),
    ).toBe('review');
  });
});
