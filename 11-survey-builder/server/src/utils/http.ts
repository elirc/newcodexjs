import type { Response } from "express";

/** Sends data in the standard success envelope. */
export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

/** Escapes CSV cells while preserving commas, quotes, and newlines. */
export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
