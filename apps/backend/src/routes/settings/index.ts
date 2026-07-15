import { Router } from 'express';

import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from '@covet/shared-types';

import { sendData, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';
import type { UserSettingsPatch } from '../../repositories/types';

/** Notification/privacy fields a PATCH may set (engine-affecting fields excluded). */
const WRITABLE_KEYS: readonly (keyof UserSettingsPatch)[] = [
  'notificationPrivacyLevel',
  'dailyPacingNotificationsEnabled',
  'saleAlertsEnabled',
  'vaultNotificationsEnabled',
  'reviewPromptsEnabled',
  'biometricLockEnabled',
  'calendarSuggestionsEnabled',
];

function pickPatch(body: UpdateSettingsRequest | undefined): UserSettingsPatch {
  const patch: UserSettingsPatch = {};
  if (!body) return patch;
  for (const key of WRITABLE_KEYS) {
    const value = body[key];
    if (value !== undefined) (patch as Record<string, unknown>)[key] = value;
  }
  return patch;
}

/**
 * /settings — read and update notification/privacy preferences. These do not
 * feed the Financial Engine, so a settings write never moves Safe to Spend
 * (strictness lives on the user and gets its own endpoint later). Only the
 * allow-listed keys are applied.
 */
export function createSettingsRouter(repos: CovetRepositories): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const settings = await repos.getUserSettings(req.userId!);
      if (!settings) {
        sendNotFound(res, 'No settings found.');
        return;
      }
      sendData<GetSettingsResponse>(res, { settings });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/', async (req, res, next) => {
    try {
      const patch = pickPatch(req.body as UpdateSettingsRequest | undefined);
      const settings = await repos.updateUserSettings(req.userId!, patch);
      if (!settings) {
        sendNotFound(res, 'No settings found.');
        return;
      }
      sendData<UpdateSettingsResponse>(res, { settings });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
