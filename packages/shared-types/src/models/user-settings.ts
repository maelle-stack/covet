import type { ISODateTimeString, LocalTimeString, NotificationPrivacyLevel, UUID } from '../common';

/** Quiet hours window in the user's local time. Default 21:00 → 09:00. */
export interface QuietHours {
  start: LocalTimeString;
  end: LocalTimeString;
}

/**
 * Per-user preferences (docs/01_consumer_experience.md Settings,
 * docs/03_notification_engine.md preferences). Defaults favor restraint.
 */
export interface UserSettings {
  userId: UUID;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;

  // Notification preferences
  quietHours: QuietHours;
  notificationPrivacyLevel: NotificationPrivacyLevel; // default 'discreet'
  dailyPacingEnabled: boolean; // show daily pace on Home
  dailyPacingNotificationsEnabled: boolean;
  saleAlertsEnabled: boolean; // default false
  vaultNotificationsEnabled: boolean;
  reviewPromptsEnabled: boolean; // pattern/event confirmation pushes

  // Security
  biometricLockEnabled: boolean;

  // Calendar preferences
  calendarSuggestionsEnabled: boolean;

  // Design: user-selected primary color for Good-state wallet/aura only
  // (docs/04_design_system.md). Hex string; null = brand default.
  walletPrimaryColor: string | null;

  // Privacy / data
  analyticsOptOut: boolean;
}
