import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";

export function notFoundMiddleware(_req: Request, res: Response) {
  return res
    .status(404)
    .json({
      success: false,
      error: { message: "Route not found", code: "NOT_FOUND" },
    });
}

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const appError =
    error instanceof AppError ? error : new AppError(error.message);
  return res.status(appError.statusCode).json({
    success: false,
    error: { message: appError.message, code: appError.code },
  });
}
