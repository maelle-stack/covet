import type { NotificationSuppressionReason, UUID } from '@covet/shared-types';

import type { NotificationEngineConfig } from './config';
import type { CandidateEvent, RecentNotificationRecord } from './types';

/** Event types whose information the user "sees" just by opening Home. */
const HOME_STATE_EVENT_TYPES = new Set<CandidateEvent['type']>([
  'status_change',
  'safe_to_spend_increase',
  'safe_to_spend_decrease',
]);

/** Event types where a repeat warning about the same situation is redundant unless worsened. */
const REPEAT_WARNING_EVENT_TYPES = new Set<CandidateEvent['type']>([
  'commitment_at_risk',
  'repetitive_behavior',
  'soft_commitment_pause',
]);

export function relatedEntityIdOf(event: CandidateEvent): UUID | null {
  switch (event.type) {
    case 'commitment_protected':
    case 'commitment_at_risk':
      return event.commitment.id;
    case 'purchase_check_follow_up':
      return event.purchaseCheck.id;
    case 'vault_affordability':
    case 'sale_alert':
      return event.vault.id;
    case 'pattern_confirmation':
      return event.pattern.id;
    case 'calendar_event_confirmation':
      return event.calendarEvent.id;
    case 'soft_commitment_pause':
      return event.relatedCommitmentId;
    default:
      return null;
  }
}

/**
 * Suppression rules (docs/03_notification_engine.md): prevent redundant
 * notifications. Repeated warnings are based on the situation and whether
 * it worsened — not merely on how many events fired.
 */
export function checkSuppression(
  event: CandidateEvent,
  args: {
    lastAppOpenAt: Date | null;
    dismissedCandidateEventIds: ReadonlySet<UUID>;
    recentNotifications: readonly RecentNotificationRecord[];
    now: Date;
  },
  config: NotificationEngineConfig,
): NotificationSuppressionReason | null {
  // Dismissed in-app: never re-push a review the user already waved off.
  if (args.dismissedCandidateEventIds.has(event.id)) {
    return 'dismissed_in_app';
  }

  // Seen in-app: if the user opened the app after this money-state event
  // occurred, they already saw the updated Home status.
  if (
    config.suppressWhenSeenInApp &&
    HOME_STATE_EVENT_TYPES.has(event.type) &&
    args.lastAppOpenAt !== null &&
    args.lastAppOpenAt.getTime() >= new Date(event.occurredAt).getTime()
  ) {
    return 'seen_in_app_recently';
  }

  // Duplicate warning: same trigger about the same entity within the
  // window, and the situation has not materially worsened.
  if (REPEAT_WARNING_EVENT_TYPES.has(event.type)) {
    const worsened =
      (event.type === 'commitment_at_risk' ||
        event.type === 'repetitive_behavior' ||
        event.type === 'soft_commitment_pause') &&
      event.worsenedSinceLastWarning;

    if (!worsened) {
      const windowMs = config.duplicateSuppressionWindowHours * 60 * 60 * 1000;
      const entityId = relatedEntityIdOf(event);
      const duplicate = args.recentNotifications.some(
        (n) =>
          n.triggerType === event.type &&
          args.now.getTime() - new Date(n.sentAt).getTime() <= windowMs &&
          (entityId === null || n.relatedEntityId === entityId),
      );
      if (duplicate) return 'duplicate_warning';
    }
  }

  return null;
}

/**
 * Rolling-24h count of already-sent non-Protect notifications, for the
 * daily quiet-posture cap.
 */
export function countRecentNonProtect(
  recentNotifications: readonly RecentNotificationRecord[],
  now: Date,
): number {
  const dayMs = 24 * 60 * 60 * 1000;
  return recentNotifications.filter(
    (n) => n.severity !== 'protect' && now.getTime() - new Date(n.sentAt).getTime() <= dayMs,
  ).length;
}
