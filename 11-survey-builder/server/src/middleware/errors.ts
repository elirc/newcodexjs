import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  statusCode: number;
  code: string;

  /** Builds an operational error that can be safely returned to clients. */
  constructor(message: string, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  /** Creates a 404 error with a stable code. */
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  /** Creates a 400 error for invalid client input. */
  constructor(message = "Invalid request") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/** Converts thrown errors into the shared error response envelope. */
export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError =
    error instanceof AppError ? error : new AppError("Unexpected server error");
  res.status(appError.statusCode).json({
    success: false,
    error: { message: appError.message, code: appError.code },
  });
}
