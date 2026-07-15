import type { NextFunction, Request, Response } from 'express';

import { DEMO_USER_ID } from '../db/seed-data';
import { sendError } from './envelope';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * DEV-ONLY auth placeholder. Real Supabase JWT verification arrives in a
 * later, gated checkpoint. For now the request is scoped to a user id from
 * the `x-covet-user-id` header, defaulting to the seeded demo user so the
 * pre-integration app and route tests work without an auth provider.
 *
 * It refuses to run outside development/test so it can never ship as the
 * production auth path by accident.
 */
export function devAuth(req: Request, res: Response, next: NextFunction): void {
  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production') {
    sendError(res, 401, {
      code: 'auth_not_configured',
      message: 'Authentication is not available yet.',
    });
    return;
  }
  const header = req.header('x-covet-user-id');
  req.userId = header && header.length > 0 ? header : DEMO_USER_ID;
  next();
}
