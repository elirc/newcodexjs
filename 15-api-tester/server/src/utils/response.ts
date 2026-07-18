import type { Response } from "express";

/** Sends successful data using the standard response envelope. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}
