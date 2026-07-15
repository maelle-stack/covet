import { Router } from 'express';

import type { UpcomingResponse } from '@covet/shared-types';

import { sendData, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';

/** /upcoming — the composite Upcoming view (Events, Recurring, Vaults). */
export function createUpcomingRouter(repos: CovetRepositories): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const upcoming = await repos.getUpcoming(req.userId!);
      if (!upcoming) {
        sendNotFound(res, 'Nothing upcoming yet.');
        return;
      }
      sendData<UpcomingResponse>(res, upcoming);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
