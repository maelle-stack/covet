import { Router } from 'express';

import type { GetSettingsResponse } from '@covet/shared-types';

import { sendData, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';

/**
 * /settings — the user's settings. Read-only in 6.1; the settings write path
 * (PATCH) lands with the write endpoints in a later checkpoint, so the
 * Settings screen's toggles stay visual-only for now.
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

  return router;
}
