import type { Response } from 'express';

import type { ApiError } from '@covet/shared-types';

/** Wrap a payload in the standard `{ data }` success envelope. */
export function sendData<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}

/** Wrap an error in the standard `{ error }` envelope with a calm message. */
export function sendError(res: Response, status: number, error: ApiError): void {
  res.status(status).json({ error });
}

/** 404 helper for "no data for this user" reads. */
export function sendNotFound(res: Response, message: string): void {
  sendError(res, 404, { code: 'not_found', message });
}
