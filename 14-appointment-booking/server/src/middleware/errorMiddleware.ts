import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";

/** Converts all thrown errors into the standard response envelope. */
export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  const appError =
    error instanceof AppError ? error : new AppError("Unexpected server error");
  res.status(appError.statusCode).json({
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
    },
  });
};
