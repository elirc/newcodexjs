import type { NextFunction, Request, Response } from "express";

/** Attaches a development user id so examples can model per-user ownership. */
export function attachRequestContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.user = { id: Number(req.header("x-user-id") ?? 1) };
  next();
}
