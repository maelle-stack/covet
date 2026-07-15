import { Router } from 'express';

import type { ConfirmCommitmentResponse, DenyCommitmentResponse } from '@covet/shared-types';

import { sendData, sendError, sendNotFound } from '../../http/envelope';
import type { CovetRepositories } from '../../repositories';
import { recalculateSafeToSpend } from '../../services/safe-to-spend/recalculate';

/**
 * /commitments — confirm/deny a detected commitment. Both are engine-affecting
 * writes: confirming a candidate turns it into protection; denying frees the
 * cash it was holding. Each mutates the commitment, then recalculates Safe to
 * Spend through the orchestrator and returns the fresh snapshot alongside it.
 */
export function createCommitmentsRouter(repos: CovetRepositories): Router {
  const router = Router();

  router.post('/:id/confirm', async (req, res, next) => {
    try {
      const userId = req.userId!;
      const confirmedAmount: unknown = req.body?.confirmedAmount;
      if (confirmedAmount !== undefined && !Number.isInteger(confirmedAmount)) {
        sendError(res, 400, {
          code: 'invalid_amount',
          message: 'confirmedAmount must be an integer number of cents.',
        });
        return;
      }

      const commitment = await repos.setCommitmentStatus(userId, req.params.id!, {
        status: 'protected',
        userConfirmed: true,
        userDenied: false,
        ...(confirmedAmount !== undefined ? { confirmedAmount: confirmedAmount as number } : {}),
      });
      if (!commitment) {
        sendNotFound(res, 'Commitment not found.');
        return;
      }

      const result = await recalculateSafeToSpend(repos, userId, 'commitment_change');
      sendData<ConfirmCommitmentResponse>(res, { commitment, snapshot: result!.snapshot });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/deny', async (req, res, next) => {
    try {
      const userId = req.userId!;
      const commitment = await repos.setCommitmentStatus(userId, req.params.id!, {
        status: 'denied',
        userConfirmed: false,
        userDenied: true,
      });
      if (!commitment) {
        sendNotFound(res, 'Commitment not found.');
        return;
      }

      const result = await recalculateSafeToSpend(repos, userId, 'commitment_change');
      sendData<DenyCommitmentResponse>(res, { commitment, snapshot: result!.snapshot });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
