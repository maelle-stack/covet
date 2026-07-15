import type { Cents, ISODateTimeString, SpendStatus, UUID } from '../common';

/** Internal severity levels (docs/03_notification_engine.md). */
export const NOTIFICATION_SEVERITIES = ['note', 'nudge', 'review', 'protect'] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

/** Primary trigger types (docs/03_notification_engine.md). */
export const NOTIFICATION_TRIGGER_TYPES = [
  'status_change',
  'safe_to_spend_increase',
  'safe_to_spend_decrease',
  'commitment_protected',
  'commitment_at_risk',
  'purchase_check_follow_up',
  'vault_affordability',
  'sale_alert',
  'pattern_confirmation',
  'calendar_event_confirmation',
  'repetitive_behavior',
  'soft_commitment_pause',
  'connection_health',
  'security',
] as const;
export type NotificationTriggerType = (typeof NOTIFICATION_TRIGGER_TYPES)[number];

export const NOTIFICATION_SUPPRESSION_REASONS = [
  'seen_in_app_recently',
  'dismissed_in_app',
  'duplicate_warning',
  'below_materiality',
  'preference_disabled',
  'daily_cap_reached',
  'quiet_hours_expired',
] as const;
export type NotificationSuppressionReason = (typeof NOTIFICATION_SUPPRESSION_REASONS)[number];

export const NOTIFICATION_ACTION_TYPES = ['approve_deny', 'confirm', 'review', 'none'] as const;
export type NotificationActionType = (typeof NOTIFICATION_ACTION_TYPES)[number];

export const NOTIFICATION_USER_RESPONSES = ['opened', 'approved', 'denied', 'dismissed'] as const;
export type NotificationUserResponse = (typeof NOTIFICATION_USER_RESPONSES)[number];

/**
 * A notification record (docs/03_notification_engine.md). Generated only by
 * the Notification Engine from candidate events — never constructed by the
 * UI. `privacyBody` is the discreet lock-screen variant; delivery must
 * respect the user's NotificationPrivacyLevel.
 */
export interface Notification {
  id: UUID;
  userId: UUID;
  candidateEventId: UUID;
  triggerType: NotificationTriggerType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  privacyBody: string;
  createdAt: ISODateTimeString;
  scheduledFor: ISODateTimeString | null;
  sentAt: ISODateTimeString | null;
  quietHoursApplied: boolean;
  batchedEventIds: readonly UUID[];
  suppressedReason: NotificationSuppressionReason | null;
  statusBefore: SpendStatus | null;
  statusAfter: SpendStatus | null;
  safeToSpendBefore: Cents | null;
  safeToSpendAfter: Cents | null;
  relatedCommitmentId: UUID | null;
  relatedVaultId: UUID | null;
  relatedPatternId: UUID | null;
  relatedPurchaseCheckId: UUID | null;
  actionType: NotificationActionType;
  userResponse: NotificationUserResponse | null;
}
