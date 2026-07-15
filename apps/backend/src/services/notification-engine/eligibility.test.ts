import { DEFAULT_NOTIFICATION_ENGINE_CONFIG } from './config';
import { evaluateEligibility, isMaterialStsChange } from './eligibility';
import {
  DEFAULT_SETTINGS,
  eventBase,
  makeCalendarEvent,
  makeCommitment,
  makePattern,
  makeSnapshot,
  makeVault,
} from './test-helpers';

const config = DEFAULT_NOTIFICATION_ENGINE_CONFIG;

describe('isMaterialStsChange', () => {
  it('matches the spec thresholds: >10%, $25 under $150, $50 otherwise', () => {
    expect(isMaterialStsChange(100_00, 70_00, config)).toBe(true); // $30 drop under $150
    expect(isMaterialStsChange(100_00, 91_00, config)).toBe(false); // $9 drop, 9%
    expect(isMaterialStsChange(300_00, 245_00, config)).toBe(true); // $55 drop
    expect(isMaterialStsChange(300_00, 260_00, config)).toBe(true); // >10%
    expect(isMaterialStsChange(1000_00, 960_00, config)).toBe(false); // $40, 4%
  });
});

describe('evaluateEligibility', () => {
  const noAppOpen = null;

  it('payday increases always notify, even below dollar thresholds', () => {
    const result = evaluateEligibility(
      {
        ...eventBase(),
        type: 'safe_to_spend_increase',
        amountBefore: 400_00,
        amountAfter: 416_00,
        paydayRelated: true,
        snapshot: makeSnapshot(),
      },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(result.eligible).toBe(true);
  });

  it('minor non-payday increases do not notify', () => {
    const result = evaluateEligibility(
      {
        ...eventBase(),
        type: 'safe_to_spend_increase',
        amountBefore: 400_00,
        amountAfter: 416_00,
        paydayRelated: false,
        snapshot: makeSnapshot(),
      },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(result).toEqual({ eligible: false, reason: 'below_materiality' });
  });

  it('a no-op status change leaves no record at all', () => {
    const result = evaluateEligibility(
      {
        ...eventBase(),
        type: 'status_change',
        statusBefore: 'YOURE_GOOD',
        statusAfter: 'YOURE_GOOD',
        snapshot: makeSnapshot(),
      },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(result).toEqual({ eligible: false, reason: null });
  });

  it('sale alerts are blocked when the user has not opted in (default off)', () => {
    const result = evaluateEligibility(
      {
        ...eventBase(),
        type: 'sale_alert',
        vault: makeVault(),
        discountFraction: 0.4,
        currentlySafeOrNearlySafe: true,
      },
      DEFAULT_SETTINGS, // saleAlertsEnabled: false
      noAppOpen,
      config,
    );
    expect(result).toEqual({ eligible: false, reason: 'preference_disabled' });
  });

  it('sale alerts with opt-in still require a meaningful discount AND current safety', () => {
    const settings = { ...DEFAULT_SETTINGS, saleAlertsEnabled: true };
    const tinyDiscount = evaluateEligibility(
      {
        ...eventBase(),
        type: 'sale_alert',
        vault: makeVault(),
        discountFraction: 0.05,
        currentlySafeOrNearlySafe: true,
      },
      settings,
      noAppOpen,
      config,
    );
    expect(tinyDiscount).toEqual({ eligible: false, reason: 'below_materiality' });

    const unsafe = evaluateEligibility(
      {
        ...eventBase(),
        type: 'sale_alert',
        vault: makeVault(),
        discountFraction: 0.3,
        currentlySafeOrNearlySafe: false,
      },
      settings,
      noAppOpen,
      config,
    );
    expect(unsafe).toEqual({ eligible: false, reason: 'below_materiality' });

    const good = evaluateEligibility(
      {
        ...eventBase(),
        type: 'sale_alert',
        vault: makeVault(),
        discountFraction: 0.3,
        currentlySafeOrNearlySafe: true,
      },
      settings,
      noAppOpen,
      config,
    );
    expect(good.eligible).toBe(true);
  });

  it('pattern confirmations only push when they materially affect the current cycle', () => {
    const minor = evaluateEligibility(
      {
        ...eventBase(),
        type: 'pattern_confirmation',
        pattern: makePattern(),
        materiallyAffectsCurrentCycle: false,
        linkedRecurringItem: null,
      },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(minor).toEqual({ eligible: false, reason: 'below_materiality' });
  });

  it('calendar confirmations wait in-app when the user has opened the app recently', () => {
    const recentlyActive = evaluateEligibility(
      {
        ...eventBase(),
        type: 'calendar_event_confirmation',
        calendarEvent: makeCalendarEvent(),
        mayAffectSafeToSpend: true,
      },
      DEFAULT_SETTINGS,
      12, // opened 12h ago, under the 48h threshold
      config,
    );
    expect(recentlyActive).toEqual({ eligible: false, reason: 'seen_in_app_recently' });

    const longAbsent = evaluateEligibility(
      {
        ...eventBase(),
        type: 'calendar_event_confirmation',
        calendarEvent: makeCalendarEvent(),
        mayAffectSafeToSpend: true,
      },
      DEFAULT_SETTINGS,
      72,
      config,
    );
    expect(longAbsent.eligible).toBe(true);
  });

  it('repetitive behavior requires enough occurrences AND material impact', () => {
    const tooFew = evaluateEligibility(
      {
        ...eventBase(),
        type: 'repetitive_behavior',
        behaviorLabel: 'delivery',
        occurrenceCount: 2,
        materialImpact: true,
        crowdingOut: 'friday',
        worsenedSinceLastWarning: false,
      },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(tooFew).toEqual({ eligible: false, reason: 'below_materiality' });

    const frequentButHarmless = evaluateEligibility(
      {
        ...eventBase(),
        type: 'repetitive_behavior',
        behaviorLabel: 'coffee',
        occurrenceCount: 6,
        materialImpact: false,
        crowdingOut: null,
        worsenedSinceLastWarning: false,
      },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(frequentButHarmless).toEqual({ eligible: false, reason: 'below_materiality' });
  });

  it('bank disconnects always pass; calendar disconnects only when planning is affected', () => {
    const bank = evaluateEligibility(
      { ...eventBase(), type: 'connection_health', provider: 'bank', affectsPlanning: false },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(bank.eligible).toBe(true);

    const calendarIrrelevant = evaluateEligibility(
      { ...eventBase(), type: 'connection_health', provider: 'calendar', affectsPlanning: false },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(calendarIrrelevant).toEqual({ eligible: false, reason: 'below_materiality' });
  });

  it('routine soft commitment protection (not near-term, never uncertain) stays quiet', () => {
    const routine = evaluateEligibility(
      {
        ...eventBase(),
        type: 'commitment_protected',
        commitment: makeCommitment({ hardness: 'soft', commitmentType: 'habit' }),
        nearTerm: false,
        previouslyUncertain: false,
      },
      DEFAULT_SETTINGS,
      noAppOpen,
      config,
    );
    expect(routine).toEqual({ eligible: false, reason: 'below_materiality' });
  });
});
