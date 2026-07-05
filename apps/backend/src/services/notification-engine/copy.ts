import type { Cents, NotificationSeverity, SpendStatus } from '@covet/shared-types';

import type { BatchedUnit } from './batching';

export interface NotificationCopy {
  title: string;
  body: string;
  /** Discreet lock-screen variant: never exposes amounts, debt risk, or embarrassing behavior. */
  privacyBody: string;
}

/** Whole dollars, rounded down — consistent with the engine's no-false-precision rule. */
function dollars(amount: Cents): string {
  return `$${Math.floor(amount / 100)}`;
}

const STATUS_LINES: Record<SpendStatus, string> = {
  YOURE_GOOD: "you're good.",
  TAKE_IT_EASY: 'take it easy today.',
  WAIT_UNTIL_PAYDAY: "i'd wait until payday.",
  LETS_NOT: "let's not right now.",
};

/**
 * Discreet lock-screen text per severity (docs/03_notification_engine.md:
 * default previews say "covet has an update" or "your status changed").
 * The delivery layer (Phase 6) picks body vs privacyBody vs a fully generic
 * line based on the user's privacy level; the engine always produces both.
 */
function privacyBodyFor(severity: NotificationSeverity, isStatusEvent: boolean): string {
  if (isStatusEvent) return 'your status changed';
  switch (severity) {
    case 'protect':
      return 'covet needs your attention';
    case 'review':
      return 'covet has a quick question';
    default:
      return 'covet has an update';
  }
}

function joinDrivers(drivers: readonly string[]): string {
  if (drivers.length === 0) return '';
  if (drivers.length === 1) return drivers[0] as string;
  return `${drivers.slice(0, -1).join(', ')} and ${drivers[drivers.length - 1]}`;
}

/**
 * All notification text comes from here — the UI never constructs
 * notification meaning (docs/03_notification_engine.md). Tone rules: no
 * emoji; lowercase where it matches the brand; "i" language for judgment,
 * neutral language for status facts; direct but never shame-based.
 */
export function buildCopy(unit: BatchedUnit, severity: NotificationSeverity): NotificationCopy {
  const event = unit.primary;
  const isStatusEvent = event.type === 'status_change';
  const privacyBody = privacyBodyFor(severity, isStatusEvent);

  switch (event.type) {
    case 'status_change': {
      const line = STATUS_LINES[event.statusAfter];
      const amount = dollars(event.snapshot.amount);
      const body =
        event.statusAfter === 'YOURE_GOOD'
          ? `${line} safe to spend is ${amount}.`
          : `${line} safe to spend is ${amount} right now.`;
      return { title: 'covet', body, privacyBody };
    }

    case 'safe_to_spend_increase': {
      const amount = dollars(event.amountAfter);
      const body = event.paydayRelated
        ? `you're good. safe to spend is ${amount}.`
        : `safe to spend is up to ${amount}.`;
      return { title: 'covet', body, privacyBody };
    }

    case 'safe_to_spend_decrease': {
      const amount = dollars(event.amountAfter);
      const drivers = joinDrivers(event.drivers);
      const body = drivers
        ? `safe to spend is ${amount} after ${drivers}.`
        : `safe to spend is ${amount}.`;
      return { title: 'covet', body, privacyBody };
    }

    case 'commitment_protected':
      return {
        title: 'covet',
        body: `your ${event.commitment.title.toLowerCase()} is covered.`,
        privacyBody,
      };

    case 'commitment_at_risk':
      return {
        title: 'covet',
        body: `heads up — ${event.commitment.title.toLowerCase()} isn't fully covered yet. let's protect it first.`,
        privacyBody,
      };

    case 'purchase_check_follow_up': {
      const item = event.purchaseCheck.parsedItemName?.toLowerCase() ?? 'that purchase';
      return {
        title: 'covet',
        body: `you're good for the ${item} now. ${event.reasonChanged}.`,
        privacyBody,
      };
    }

    case 'vault_affordability': {
      const title = event.vault.title.toLowerCase();
      const body = event.noLongerFits
        ? `the ${title} doesn't fit safely right now. i'll keep watching.`
        : event.becameAffordable
          ? `the ${title} fits now without touching what's protected.`
          : `the timing on the ${title} moved. worth a look when you have a minute.`;
      return { title: 'covet', body, privacyBody };
    }

    case 'sale_alert': {
      const pct = Math.round(event.discountFraction * 100);
      return {
        title: 'covet',
        body: `the ${event.vault.title.toLowerCase()} you saved is ${pct}% off — and it fits.`,
        privacyBody,
      };
    }

    case 'pattern_confirmation': {
      const item = event.linkedRecurringItem;
      const body =
        item && item.amountEstimate !== null
          ? `looks like ${item.title.toLowerCase()} is usually ${dollars(item.amountEstimate)}. plan around it?`
          : `${event.pattern.description} plan around it?`;
      return { title: 'covet', body, privacyBody };
    }

    case 'calendar_event_confirmation':
      return {
        title: 'covet',
        body: `does ${event.calendarEvent.title.toLowerCase()} need money set aside?`,
        privacyBody,
      };

    case 'repetitive_behavior': {
      const crowding = event.crowdingOut ? ` it's starting to crowd out ${event.crowdingOut}.` : '';
      return {
        title: 'covet',
        body: `not ${event.behaviorLabel} again this week.${crowding}`,
        privacyBody,
      };
    }

    case 'soft_commitment_pause': {
      const resume = event.resumeExpectation
        ? ` you should be good again ${event.resumeExpectation}.`
        : '';
      return {
        title: 'covet',
        body: `let's hold off on ${event.itemTitle.toLowerCase()} this time.${resume}`,
        privacyBody,
      };
    }

    case 'connection_health':
      return event.provider === 'bank'
        ? {
            title: 'covet',
            body: 'bank connection needs a refresh. safe to spend may be less accurate until you reconnect.',
            privacyBody,
          }
        : {
            title: 'covet',
            body: 'calendar connection needs a refresh. upcoming may miss plans until you reconnect.',
            privacyBody,
          };

    case 'security':
      return {
        title: 'covet',
        body: 'there’s a security issue that needs your attention. open covet to review it.',
        privacyBody,
      };
  }
}
