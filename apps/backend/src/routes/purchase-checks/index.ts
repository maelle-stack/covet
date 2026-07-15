import { Router } from 'express';

import type { SeedPurchaseCheckResponse } from '@covet/shared-types';

import { sendData, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';

/**
 * /purchase-checks — read side only for 6.1. `/seed` supplies the opening
 * exchange the Purchase Check thread starts from. The create flow (POST) is
 * intentionally deferred: it needs the engine's hypothetical plus the AI
 * abstraction, which arrive in a later gated checkpoint.
 */
export function createPurchaseChecksRouter(repos: CovetRepositories): Router {
  const router = Router();

  router.get('/seed', async (req, res, next) => {
    try {
      const purchaseCheck = await repos.getSeedPurchaseCheck(req.userId!);
      if (!purchaseCheck) {
        sendNotFound(res, 'No seed purchase check.');
        return;
      }
      sendData<SeedPurchaseCheckResponse>(res, { purchaseCheck });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
