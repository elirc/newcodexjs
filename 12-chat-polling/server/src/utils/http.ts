import type { Response } from "express";

/** Sends a success response in the standard envelope. */
export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

