import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      requestContext: {
        requestId: string;
        actor: string;
        role: string;
      };
    }
  }
}

export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId = String(req.headers["x-request-id"] || crypto.randomUUID());
  const actor = String(req.headers["x-demo-user"] || "demo.user@example.com");
  const role = String(req.headers["x-demo-role"] || "operator");

  req.requestContext = { requestId, actor, role };
  res.setHeader("x-request-id", requestId);
  next();
}
