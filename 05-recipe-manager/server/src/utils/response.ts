import type { Response } from 'express';

/** Sends a successful API response using the shared envelope. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}
