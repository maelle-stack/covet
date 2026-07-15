import { processCandidateEvents } from './index';
import {
  DEFAULT_SETTINGS,
  eventBase,
  makeCalendarEvent,
  makeCommitment,
  makeInput,
  makePattern,
  makePurchaseCheck,
  makeRecurringItem,
  makeSnapshot,
  makeVault,
  NOW,
} from './test-helpers';
import type { CandidateEvent } from './types';

// NOW is 16:00 UTC = noon in New York: outside default quiet hours.
const LATE_NIGHT = '2026-07-05T03:00:00Z'; // 11pm July 4 in New York: inside quiet hours.

function paydayEvent(): CandidateEvent {
  return {
    ...eventBase(),
    type: 'safe_to_spend_increase',
    amountBefore: 120_00,
    amountAfter: 416_00,
    paydayRelated: true,
    snapshot: makeSnapshot({ amount: 416_00 }),
  };
}

function bankDisconnectEvent(): CandidateEvent {
  return { ...eventBase(), type: 'connection_health', provider: 'bank', affectsPlanning: true };
}

describe('processCandidateEvents — scenarios', () => {
  it('payday: "you\'re good. safe to spend is $416." with a discreet privacy body', () => {
    const [notification] = processCandidateEvents(makeInput([paydayEvent()]));

    expect(notification?.suppressedReason).toBeNull();
    expect(notification?.severity).toBe('note');
    expect(notification?.body).toBe("you're good. safe to spend is $416.");
    expect(notification?.privacyBody).toBe('covet has an update');
    expect(notification?.body).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u); // no emoji
    expect(notification?.scheduledFor).toBe(new Date(NOW).toISOString());
  });

  it('every produced record carries both body and privacyBody, and privacyBody never contains amounts', () => {
    const events: CandidateEvent[] = [
      paydayEvent(),
      {
        ...eventBase(),
        type: 'commitment_at_risk',
        commitment: makeCommitment(),
        worsenedSinceLastWarning: false,
      },
    ];
    const results = processCandidateEvents(makeInput(events));

    for (const n of results) {
      expect(n.body.length).toBeGreaterThan(0);
      expect(n.privacyBody.length).toBeGreaterThan(0);
      expect(n.privacyBody).not.toMatch(/\$\d/);
    }
  });

  it('batches a status change + transaction decrease into ONE notification with batchedEventIds', () => {
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

    const results = processCandidateEvents(makeInput([decrease, statusChange]));
    expect(results).toHaveLength(1);
    expect(results[0]?.batchedEventIds).toEqual([decrease.id]);
    expect(results[0]?.statusAfter).toBe('TAKE_IT_EASY');
  });

  it('a transaction-triggered decrease is delayed a few minutes to avoid stacking on bank alerts', () => {
    const decrease: CandidateEvent = {
      ...eventBase(),
      type: 'safe_to_spend_decrease',
      amountBefore: 350_00,
      amountAfter: 280_00,
      transactionTriggered: true,
      drivers: ['groceries'],
      snapshot: makeSnapshot({ amount: 280_00 }),
    };
    const [notification] = processCandidateEvents(makeInput([decrease]));

    const delayMs = new Date(notification?.scheduledFor ?? 0).getTime() - new Date(NOW).getTime();
    expect(delayMs).toBe(5 * 60 * 1000);
  });

  it('defers a non-urgent notification during quiet hours to 9am local, marking quietHoursApplied', () => {
    const [notification] = processCandidateEvents(
      makeInput([{ ...paydayEvent(), occurredAt: LATE_NIGHT }], { now: LATE_NIGHT }),
    );

    expect(notification?.quietHoursApplied).toBe(true);
    // Next 9am New York = 13:00 UTC.
    expect(notification?.scheduledFor).toBe('2026-07-05T13:00:00.000Z');
  });

  it('a Protect event (bank disconnect) sends immediately, even during quiet hours', () => {
    const [notification] = processCandidateEvents(
      makeInput([{ ...bankDisconnectEvent(), occurredAt: LATE_NIGHT }], { now: LATE_NIGHT }),
    );

    expect(notification?.severity).toBe('protect');
    expect(notification?.quietHoursApplied).toBe(false);
    expect(notification?.scheduledFor).toBe(new Date(LATE_NIGHT).toISOString());
    expect(notification?.body).toContain('bank connection needs a refresh');
  });

  it('drops a quiet-hours-deferred candidate that expires before morning', () => {
    const expiring: CandidateEvent = {
      ...eventBase(),
      occurredAt: LATE_NIGHT,
      expiresAt: '2026-07-05T06:00:00Z', // before the 13:00 UTC quiet-hours end
      type: 'soft_commitment_pause',
      itemTitle: 'Brunch',
      relatedCommitmentId: null,
      resumeExpectation: null,
      worsenedSinceLastWarning: false,
    };
    const [notification] = processCandidateEvents(makeInput([expiring], { now: LATE_NIGHT }));

    expect(notification?.suppressedReason).toBe('quiet_hours_expired');
    expect(notification?.scheduledFor).toBeNull();
  });

  it('enforces the 0–2/day quiet posture: the third non-Protect candidate is capped', () => {
    const events: CandidateEvent[] = [
      {
        ...eventBase(),
        type: 'commitment_protected',
        commitment: makeCommitment({
          title: 'Concert',
          commitmentType: 'event',
          hardness: 'semi_hard',
        }),
        nearTerm: true,
        previouslyUncertain: true,
      },
      {
        ...eventBase(),
        type: 'purchase_check_follow_up',
        purchaseCheck: makePurchaseCheck(),
        nowSafe: true,
        reasonChanged: 'payday landed',
      },
      {
        ...eventBase(),
        type: 'soft_commitment_pause',
        itemTitle: 'Brunch',
        relatedCommitmentId: null,
        resumeExpectation: 'in two weeks',
        worsenedSinceLastWarning: false,
      },
    ];
    const results = processCandidateEvents(makeInput(events));

    const delivered = results.filter((n) => n.suppressedReason === null);
    const capped = results.filter((n) => n.suppressedReason === 'daily_cap_reached');
    expect(delivered).toHaveLength(2);
    expect(capped).toHaveLength(1);
  });

  it('the daily cap counts notifications already sent earlier today', () => {
    const results = processCandidateEvents(
      makeInput([paydayEvent()], {
        recentNotifications: [
          {
            triggerType: 'safe_to_spend_decrease',
            severity: 'nudge',
            sentAt: '2026-07-04T10:00:00Z',
            relatedEntityId: null,
          },
          {
            triggerType: 'soft_commitment_pause',
            severity: 'nudge',
            sentAt: '2026-07-04T08:00:00Z',
            relatedEntityId: null,
          },
        ],
      }),
    );
    expect(results[0]?.suppressedReason).toBe('daily_cap_reached');
  });

  it('a Protect event bypasses the daily cap', () => {
    const results = processCandidateEvents(
      makeInput([bankDisconnectEvent()], {
        recentNotifications: [
          {
            triggerType: 'safe_to_spend_decrease',
            severity: 'nudge',
            sentAt: '2026-07-04T10:00:00Z',
            relatedEntityId: null,
          },
          {
            triggerType: 'soft_commitment_pause',
            severity: 'nudge',
            sentAt: '2026-07-04T08:00:00Z',
            relatedEntityId: null,
          },
        ],
      }),
    );
    expect(results[0]?.suppressedReason).toBeNull();
  });

  it('suppresses a status push the user already saw by opening the app after the change', () => {
    const statusChange: CandidateEvent = {
      ...eventBase(),
      type: 'status_change',
      statusBefore: 'TAKE_IT_EASY',
      statusAfter: 'YOURE_GOOD',
      snapshot: makeSnapshot(),
    };
    const [notification] = processCandidateEvents(
      makeInput([statusChange], { lastAppOpenAt: '2026-07-04T16:30:00Z' }),
    );
    expect(notification?.suppressedReason).toBe('seen_in_app_recently');
  });

  it('important commitment at risk notifies at Protect severity with review action', () => {
    const [notification] = processCandidateEvents(
      makeInput([
        {
          ...eventBase(),
          type: 'commitment_at_risk',
          commitment: makeCommitment({ title: 'Rent' }),
          worsenedSinceLastWarning: false,
        },
      ]),
    );
    expect(notification?.severity).toBe('protect');
    expect(notification?.actionType).toBe('review');
    expect(notification?.relatedCommitmentId).not.toBeNull();
  });

  it('soft commitment pause reads like Covet, not a bank', () => {
    const [notification] = processCandidateEvents(
      makeInput([
        {
          ...eventBase(),
          type: 'soft_commitment_pause',
          itemTitle: 'Brunch',
          relatedCommitmentId: null,
          resumeExpectation: 'in two weeks',
          worsenedSinceLastWarning: false,
        },
      ]),
    );
    expect(notification?.body).toBe(
      "let's hold off on brunch this time. you should be good again in two weeks.",
    );
  });

  it('purchase check follow-up: a prior "wait" that becomes safe notifies with the reason', () => {
    const purchaseCheck = makePurchaseCheck({ parsedItemName: 'Jacket' });
    const [notification] = processCandidateEvents(
      makeInput([
        {
          ...eventBase(),
          type: 'purchase_check_follow_up',
          purchaseCheck,
          nowSafe: true,
          reasonChanged: 'payday landed',
        },
      ]),
    );
    expect(notification?.body).toBe("you're good for the jacket now. payday landed.");
    expect(notification?.relatedPurchaseCheckId).toBe(purchaseCheck.id);
  });

  it('vault affordability notifies when enabled and stays silent when the user disabled vault alerts', () => {
    const event: CandidateEvent = {
      ...eventBase(),
      type: 'vault_affordability',
      vault: makeVault({ title: 'Camera' }),
      becameAffordable: true,
      affordabilityDateChangedMaterially: false,
      noLongerFits: false,
    };

    const [enabled] = processCandidateEvents(makeInput([event]));
    expect(enabled?.suppressedReason).toBeNull();
    expect(enabled?.body).toContain('camera');

    const [disabled] = processCandidateEvents(
      makeInput([{ ...event, id: 'event-vault-2' }], {
        settings: { ...DEFAULT_SETTINGS, vaultNotificationsEnabled: false },
      }),
    );
    expect(disabled?.suppressedReason).toBe('preference_disabled');
  });

  it('pattern confirmation copy is specific, not "recurring transaction detected"', () => {
    const [notification] = processCandidateEvents(
      makeInput([
        {
          ...eventBase(),
          type: 'pattern_confirmation',
          pattern: makePattern(),
          materiallyAffectsCurrentCycle: true,
          linkedRecurringItem: makeRecurringItem({ title: 'Pilates', amountEstimate: 50_00 }),
        },
      ]),
    );
    expect(notification?.body).toBe('looks like pilates is usually $50. plan around it?');
    expect(notification?.actionType).toBe('approve_deny');
  });

  it('calendar confirmation pushes only for a long-absent user', () => {
    const event: CandidateEvent = {
      ...eventBase(),
      type: 'calendar_event_confirmation',
      calendarEvent: makeCalendarEvent(),
      mayAffectSafeToSpend: true,
    };

    const [absent] = processCandidateEvents(
      makeInput([event], { lastAppOpenAt: '2026-06-30T16:00:00Z' }), // 4 days ago
    );
    expect(absent?.suppressedReason).toBeNull();
    expect(absent?.body).toBe("does saturday's birthday dinner need money set aside?");
  });

  it('never notifies for a minor Safe to Spend wiggle', () => {
    const minor: CandidateEvent = {
      ...eventBase(),
      type: 'safe_to_spend_decrease',
      amountBefore: 1000_00,
      amountAfter: 985_00, // $15, 1.5%
      transactionTriggered: true,
      drivers: ['coffee'],
      snapshot: makeSnapshot({ amount: 985_00 }),
    };
    const [notification] = processCandidateEvents(makeInput([minor]));
    expect(notification?.suppressedReason).toBe('below_materiality');
    expect(notification?.scheduledFor).toBeNull();
  });

  it('is deterministic apart from generated ids: same input, same decisions and copy', () => {
    const input = makeInput([paydayEvent()]);
    const [first] = processCandidateEvents(input);
    const [second] = processCandidateEvents(input);

    expect(first?.body).toBe(second?.body);
    expect(first?.scheduledFor).toBe(second?.scheduledFor);
    expect(first?.suppressedReason).toBe(second?.suppressedReason);
  });
});
