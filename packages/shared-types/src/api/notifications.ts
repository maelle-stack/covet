import type { NotificationPrivacyLevel } from '../common';
import type { QuietHours } from '../models/user-settings';

/**
 * GET / PUT /notifications/preferences
 * (docs/03_notification_engine.md — quiet hours, privacy level, daily
 * pacing, sale alerts, vault alerts, review prompts).
 */
export interface NotificationPreferences {
  quietHours: QuietHours;
  privacyLevel: NotificationPrivacyLevel;
  dailyPacingNotificationsEnabled: boolean;
  saleAlertsEnabled: boolean;
  vaultNotificationsEnabled: boolean;
  reviewPromptsEnabled: boolean;
}

export interface GetNotificationPreferencesResponse {
  preferences: NotificationPreferences;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Partial<NotificationPreferences>;
}

export interface UpdateNotificationPreferencesResponse {
  preferences: NotificationPreferences;
}
