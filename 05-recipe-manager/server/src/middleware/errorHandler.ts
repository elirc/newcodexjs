import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors.js';

/** Converts thrown errors into the standard API error envelope. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
  const message = error instanceof AppError ? error.message : 'Something went wrong';
  res.status(statusCode).json({ success: false, error: { message, code } });
};
