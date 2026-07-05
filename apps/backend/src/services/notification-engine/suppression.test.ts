import { DEFAULT_NOTIFICATION_ENGINE_CONFIG } from './config';
import { checkSuppression, countRecentNonProtect } from './suppression';
import { eventBase, makeCommitment, makeSnapshot, NOW } from './test-helpers';
import type { CandidateEvent } from './types';

const config = DEFAULT_NOTIFICATION_ENGINE_CONFIG;
const now = new Date(NOW);

const bareArgs = {
  lastAppOpenAt: null,
  dismissedCandidateEventIds: new Set<string>(),
  recentNotifications: [],
  now,
};

function statusEvent(): CandidateEvent {
  return {
    ...eventBase(),
    type: 'status_change',
    statusBefore: 'YOURE_GOOD',
    statusAfter: 'TAKE_IT_EASY',
    snapshot: makeSnapshot(),
  };
}

describe('checkSuppression', () => {
  it('suppresses a money-state push when the user opened the app after the event', () => {
    const event = statusEvent();
    const result = checkSuppression(
      event,
      { ...bareArgs, lastAppOpenAt: new Date('2026-07-04T16:30:00Z') }, // after occurredAt
      config,
    );
    expect(result).toBe('seen_in_app_recently');
  });

  it('does not suppress when the app open predates the event', () => {
    const event = statusEvent();
    const result = checkSuppression(
      event,
      { ...bareArgs, lastAppOpenAt: new Date('2026-07-04T10:00:00Z') },
      config,
    );
    expect(result).toBeNull();
  });

  it('suppresses a review whose in-app Action the user already dismissed', () => {
    const event = statusEvent();
    const result = checkSuppression(
      event,
      { ...bareArgs, dismissedCandidateEventIds: new Set([event.id]) },
      config,
    );
    expect(result).toBe('dismissed_in_app');
  });

  it('suppresses a repeat warning about the same commitment within the window', () => {
    const commitment = makeCommitment();
    const event: CandidateEvent = {
      ...eventBase(),
      type: 'commitment_at_risk',
      commitment,
      worsenedSinceLastWarning: false,
    };
    const result = checkSuppression(
      event,
      {
        ...bareArgs,
        recentNotifications: [
          {
            triggerType: 'commitment_at_risk',
            severity: 'protect',
            sentAt: '2026-07-04T10:00:00Z', // 6h ago, inside 24h window
            relatedEntityId: commitment.id,
          },
        ],
      },
      config,
    );
    expect(result).toBe('duplicate_warning');
  });

  it('lets a repeat warning through when the situation has worsened', () => {
    const commitment = makeCommitment();
    const event: CandidateEvent = {
      ...eventBase(),
      type: 'commitment_at_risk',
      commitment,
      worsenedSinceLastWarning: true,
    };
    const result = checkSuppression(
      event,
      {
        ...bareArgs,
        recentNotifications: [
          {
            triggerType: 'commitment_at_risk',
            severity: 'protect',
            sentAt: '2026-07-04T10:00:00Z',
            relatedEntityId: commitment.id,
          },
        ],
      },
      config,
    );
    expect(result).toBeNull();
  });

  it('does not treat a warning about a DIFFERENT commitment as a duplicate', () => {
    const event: CandidateEvent = {
      ...eventBase(),
      type: 'commitment_at_risk',
      commitment: makeCommitment(),
      worsenedSinceLastWarning: false,
    };
    const result = checkSuppression(
      event,
      {
        ...bareArgs,
        recentNotifications: [
          {
            triggerType: 'commitment_at_risk',
            severity: 'protect',
            sentAt: '2026-07-04T10:00:00Z',
            relatedEntityId: 'some-other-commitment',
          },
        ],
      },
      config,
    );
    expect(result).toBeNull();
  });
});

describe('countRecentNonProtect', () => {
  it('counts only non-Protect notifications within the rolling 24h window', () => {
    const count = countRecentNonProtect(
      [
        {
          triggerType: 'safe_to_spend_increase',
          severity: 'note',
          sentAt: '2026-07-04T10:00:00Z',
          relatedEntityId: null,
        },
        {
          triggerType: 'soft_commitment_pause',
          severity: 'nudge',
          sentAt: '2026-07-04T08:00:00Z',
          relatedEntityId: null,
        },
        {
          triggerType: 'security',
          severity: 'protect',
          sentAt: '2026-07-04T09:00:00Z',
          relatedEntityId: null,
        },
        {
          triggerType: 'safe_to_spend_decrease',
          severity: 'nudge',
          sentAt: '2026-07-02T10:00:00Z',
          relatedEntityId: null,
        }, // stale
      ],
      now,
    );
    expect(count).toBe(2);
  });
});
