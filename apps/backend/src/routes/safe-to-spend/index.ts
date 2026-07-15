import { Router } from 'express';

import type { GetCurrentSafeToSpendResponse } from '@covet/shared-types';

import { sendData, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';

/**
 * /safe-to-spend — the Safe to Spend snapshot the engine produced. This
 * route is a pure read: it never calculates Safe to Spend (that stays in the
 * Financial Engine). Recalculation endpoints arrive in a later checkpoint.
 */
export function createSafeToSpendRouter(repos: CovetRepositories): Router {
  const router = Router();

  router.get('/current', async (req, res, next) => {
    try {
      const snapshot = await repos.getLatestSnapshot(req.userId!);
      if (!snapshot) {
        sendNotFound(res, 'No Safe to Spend snapshot yet.');
        return;
      }
      sendData<GetCurrentSafeToSpendResponse>(res, { snapshot });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
