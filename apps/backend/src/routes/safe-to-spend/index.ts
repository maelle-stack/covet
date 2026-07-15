import { Router } from 'express';

import {
  RECALCULATION_REASONS,
  type GetCurrentSafeToSpendResponse,
  type RecalculateSafeToSpendResponse,
  type RecalculationReason,
} from '@covet/shared-types';

import { sendData, sendError, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';
import { recalculateSafeToSpend } from '../../services/safe-to-spend/recalculate';

function isReason(value: unknown): value is RecalculationReason {
  return typeof value === 'string' && (RECALCULATION_REASONS as readonly string[]).includes(value);
}

/**
 * /safe-to-spend — the current snapshot (pure read) and an explicit
 * recalculation trigger. Neither computes money: the engine owns that, and
 * the orchestrator persists the append-only result.
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

  router.post('/recalculate', async (req, res, next) => {
    try {
      const reason: unknown = req.body?.reason;
      if (!isReason(reason)) {
        sendError(res, 400, { code: 'invalid_reason', message: 'A valid reason is required.' });
        return;
      }
      const result = await recalculateSafeToSpend(repos, req.userId!, reason);
      if (!result) {
        sendNotFound(res, 'No Safe to Spend inputs for this user.');
        return;
      }
      sendData<RecalculateSafeToSpendResponse>(res, result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
