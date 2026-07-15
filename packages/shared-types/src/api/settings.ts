import type { UserSettings } from '../models/user-settings';

/** GET /settings — the current user's settings. */
export interface GetSettingsResponse {
  settings: UserSettings;
}
