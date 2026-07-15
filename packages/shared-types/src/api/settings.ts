import type { NotificationPrivacyLevel } from '../common';
import type { UserSettings } from '../models/user-settings';

/** GET /settings — the current user's settings. */
export interface GetSettingsResponse {
  settings: UserSettings;
}

/**
 * PATCH /settings — updates notification/privacy preferences only. Fields that
 * feed the Financial Engine (e.g. strictness) are not changed here; those get
 * their own endpoint so a settings write never silently moves Safe to Spend.
 * All fields optional; only provided keys change.
 */
export interface UpdateSettingsRequest {
  notificationPrivacyLevel?: NotificationPrivacyLevel;
  dailyPacingNotificationsEnabled?: boolean;
  saleAlertsEnabled?: boolean;
  vaultNotificationsEnabled?: boolean;
  reviewPromptsEnabled?: boolean;
  biometricLockEnabled?: boolean;
  calendarSuggestionsEnabled?: boolean;
}

export interface UpdateSettingsResponse {
  settings: UserSettings;
}
