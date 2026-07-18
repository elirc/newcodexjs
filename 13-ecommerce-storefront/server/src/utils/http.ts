import type { Response } from "express";

/** Sends the standard success envelope. */
export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

/** Creates a readable order number. */
export function orderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

