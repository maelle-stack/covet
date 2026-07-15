import express, { type Express, type NextFunction, type Request, type Response } from 'express';

import { devAuth } from './http/auth';
import { sendError } from './http/envelope';
import type { CovetRepositories } from './repositories';
import { createActivityRouter } from './routes/activity';
import { createCommitmentsRouter } from './routes/commitments';
import { createPurchaseChecksRouter } from './routes/purchase-checks';
import { createSafeToSpendRouter } from './routes/safe-to-spend';
import { createSettingsRouter } from './routes/settings';
import { createUpcomingRouter } from './routes/upcoming';

/**
 * Builds the Express app around a repository implementation. Keeping app
 * construction separate from the listener lets tests mount it with the
 * in-memory repositories via supertest, and lets `index.ts` wire the
 * configured data source. Routes call only repositories/services — no
 * financial or notification logic lives here.
 */
export function createApp(repos: CovetRepositories): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Read endpoints for the current Phase 5 screens. Dev auth scopes each
  // request to a user id (real Supabase JWT verification is a later checkpoint).
  app.use('/safe-to-spend', devAuth, createSafeToSpendRouter(repos));
  app.use('/activity', devAuth, createActivityRouter(repos));
  app.use('/upcoming', devAuth, createUpcomingRouter(repos));
  app.use('/settings', devAuth, createSettingsRouter(repos));
  app.use('/commitments', devAuth, createCommitmentsRouter(repos));
  app.use('/purchase-checks', devAuth, createPurchaseChecksRouter(repos));

  // Central error handler — always emits the calm `{ error }` envelope.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('unhandled route error', err);
    sendError(res, 500, { code: 'internal_error', message: 'Something went wrong.' });
  });

  return app;
}
