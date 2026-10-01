import type { Response } from "express";

/** Sends the standard success envelope. */
export function sendSuccess(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}
