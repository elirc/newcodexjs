import type { Response } from "express";

export function sendSuccess(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}
