import type { Response } from "express";

/** Sends a successful response using the project-wide envelope shape. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}
