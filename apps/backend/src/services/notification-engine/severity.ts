import { SPEND_STATUSES, type NotificationSeverity } from '@covet/shared-types';

import type { CandidateEvent } from './types';

/** Higher index = more protective/worse state. */
function statusRank(status: (typeof SPEND_STATUSES)[number]): number {
  return SPEND_STATUSES.indexOf(status);
}

/**
 * Severity assignment (docs/03_notification_engine.md): Note = low-urgency
 * information, Nudge = behavioral redirect, Review = needs user
 * confirmation, Protect = urgent/high-importance. These names stay
 * internal; users never see severity labels in v1.
 */
export function resolveSeverity(event: CandidateEvent): NotificationSeverity {
  switch (event.type) {
    case 'status_change':
      // Worsening status is a redirect; improving status is good news.
      return statusRank(event.statusAfter) > statusRank(event.statusBefore) ? 'nudge' : 'note';
    case 'safe_to_spend_increase':
      return 'note';
    case 'safe_to_spend_decrease':
      return 'nudge';
    case 'commitment_protected':
      return 'note';
    case 'commitment_at_risk':
      // Rent, essential bills, insurance, debt minimums, confirmed travel,
      // important user-confirmed events use Protect when at risk. A soft
      // habit slipping is a nudge, not an emergency.
      return event.commitment.hardness === 'soft' ? 'nudge' : 'protect';
    case 'purchase_check_follow_up':
      return 'note';
    case 'vault_affordability':
      return 'note';
    case 'sale_alert':
      return 'note';
    case 'pattern_confirmation':
      return 'review';
    case 'calendar_event_confirmation':
      return 'review';
    case 'repetitive_behavior':
      return 'nudge';
    case 'soft_commitment_pause':
      return 'nudge';
    case 'connection_health':
      // A bank disconnect invalidates Safe to Spend trust -> Protect,
      // sends immediately and can break quiet hours. Calendar disconnects
      // are less urgent -> Review.
      return event.provider === 'bank' ? 'protect' : 'review';
    case 'security':
      return 'protect';
  }
}
