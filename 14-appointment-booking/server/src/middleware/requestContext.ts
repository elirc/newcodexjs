import type { NextFunction, Request, Response } from "express";

/** Attaches a simple development user context from headers for role-aware examples. */
export function attachRequestContext(req: Request, _res: Response, next: NextFunction): void {
  const id = Number(req.header("x-user-id") ?? 4);
  const role = (req.header("x-user-role") ?? "customer") as "customer" | "provider" | "admin";
  req.user = { id, role };
  next();
}
