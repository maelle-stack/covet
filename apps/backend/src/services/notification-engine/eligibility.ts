import type { Cents, NotificationSuppressionReason } from '@covet/shared-types';

import type { NotificationEngineConfig } from './config';
import type { CandidateEvent, NotificationContextSettings } from './types';

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: NotificationSuppressionReason }
  /** Drop entirely: not even worth a suppressed record (e.g. malformed/no-op events). */
  | { eligible: false; reason: null };

/** Mirrors the Financial Engine's materiality rule for Safe to Spend changes. */
export function isMaterialStsChange(
  before: Cents,
  after: Cents,
  config: NotificationEngineConfig,
): boolean {
  const m = config.materiality;
  if (before === 0) return after !== 0;

  const relativeChange = Math.abs(after - before) / Math.abs(before);
  if (relativeChange > m.relativeChangeThreshold) return true;

  if (after < before) {
    const decrease = before - after;
    const threshold =
      before < m.lowBalanceThresholdCents
        ? m.lowBalanceDecreaseThresholdCents
        : m.normalDecreaseThresholdCents;
    return decrease >= threshold;
  }

  return after - before >= m.minIncreaseCents;
}

/**
 * Per-event-type gate: user preferences first, then materiality. This is
 * where the spec's "never notify for..." list is enforced — anything that
 * does not require action or materially improve reassurance stops here.
 * When the rule is ambiguous the answer is always "don't notify"
 * (docs/03_notification_engine.md: "If Covet is unsure whether to notify,
 * it should not notify.").
 */
export function evaluateEligibility(
  event: CandidateEvent,
  settings: NotificationContextSettings,
  hoursSinceLastAppOpen: number | null,
  config: NotificationEngineConfig,
): EligibilityResult {
  switch (event.type) {
    case 'status_change':
      // All material status changes notify; a status change is material by definition.
      return event.statusBefore === event.statusAfter
        ? { eligible: false, reason: null }
        : { eligible: true };

    case 'safe_to_spend_increase':
      // Payday increases always notify ("you're good. safe to spend is $416.").
      if (event.paydayRelated) return { eligible: true };
      return isMaterialStsChange(event.amountBefore, event.amountAfter, config)
        ? { eligible: true }
        : { eligible: false, reason: 'below_materiality' };

    case 'safe_to_spend_decrease':
      return isMaterialStsChange(event.amountBefore, event.amountAfter, config)
        ? { eligible: true }
        : { eligible: false, reason: 'below_materiality' };

    case 'commitment_protected':
      // Reassurance is allowed when the commitment is important, near-term,
      // or previously uncertain — not for every routine protection.
      return event.nearTerm || event.previouslyUncertain || event.commitment.hardness !== 'soft'
        ? { eligible: true }
        : { eligible: false, reason: 'below_materiality' };

    case 'commitment_at_risk':
      return { eligible: true };

    case 'purchase_check_follow_up':
      return event.nowSafe ? { eligible: true } : { eligible: false, reason: 'below_materiality' };

    case 'vault_affordability':
      if (!settings.vaultNotificationsEnabled) {
        return { eligible: false, reason: 'preference_disabled' };
      }
      return event.becameAffordable ||
        event.affordabilityDateChangedMaterially ||
        event.noLongerFits
        ? { eligible: true }
        : { eligible: false, reason: 'below_materiality' };

    case 'sale_alert':
      // Tightly controlled: opted in + saved item + meaningful discount +
      // currently safe/nearly safe. Covet is not a coupon app.
      if (!settings.saleAlertsEnabled) return { eligible: false, reason: 'preference_disabled' };
      if (
        event.discountFraction < config.saleAlertMinDiscountFraction ||
        !event.currentlySafeOrNearlySafe
      ) {
        return { eligible: false, reason: 'below_materiality' };
      }
      return { eligible: true };

    case 'pattern_confirmation':
      if (!settings.reviewPromptsEnabled) return { eligible: false, reason: 'preference_disabled' };
      // Minor patterns that don't affect the current cycle wait in-app.
      return event.materiallyAffectsCurrentCycle
        ? { eligible: true }
        : { eligible: false, reason: 'below_materiality' };

    case 'calendar_event_confirmation': {
      if (!settings.reviewPromptsEnabled) return { eligible: false, reason: 'preference_disabled' };
      if (!event.mayAffectSafeToSpend) return { eligible: false, reason: 'below_materiality' };
      // If the user has been in the app recently, the event appears as an
      // in-app Action instead of a push.
      const recentlyActive =
        hoursSinceLastAppOpen !== null &&
        hoursSinceLastAppOpen < config.reviewPushMinHoursSinceAppOpen;
      return recentlyActive
        ? { eligible: false, reason: 'seen_in_app_recently' }
        : { eligible: true };
    }

    case 'repetitive_behavior':
      // Requires clear, specific, material evidence — never moralize
      // frequency alone (docs/03_notification_engine.md).
      return event.occurrenceCount >= config.repetitiveBehaviorMinOccurrences &&
        event.materialImpact
        ? { eligible: true }
        : { eligible: false, reason: 'below_materiality' };

    case 'soft_commitment_pause':
      return { eligible: true };

    case 'connection_health':
      // Bank disconnects always notify. Calendar disconnects only when they
      // affect planning accuracy.
      if (event.provider === 'bank') return { eligible: true };
      return event.affectsPlanning
        ? { eligible: true }
        : { eligible: false, reason: 'below_materiality' };

    case 'security':
      return { eligible: true };
  }
}
