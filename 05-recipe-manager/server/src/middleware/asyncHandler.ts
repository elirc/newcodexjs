import type { NextFunction, Request, Response } from 'express';

/** Wraps async controllers so thrown errors reach centralized middleware. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
