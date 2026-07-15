import { Router } from 'express';

import type { ActivityFeedResponse } from '@covet/shared-types';

import { sendData, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';

/** /activity — the composite Activity feed (Insights, Actions, Transactions). */
export function createActivityRouter(repos: CovetRepositories): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const feed = await repos.getActivity(req.userId!);
      if (!feed) {
        sendNotFound(res, 'No activity yet.');
        return;
      }
      sendData<ActivityFeedResponse>(res, feed);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
