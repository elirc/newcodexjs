class AppError extends Error {
  /**
   * Creates an operational API error.
   * @param {string} message Error message.
   * @param {number} statusCode HTTP status code.
   * @param {string} code Error code.
   */
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  /** Creates a not-found error. */
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

class ValidationError extends AppError {
  /** Creates a validation error. */
  constructor(message = "Invalid request") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/**
 * Catches rejected async handlers.
 * @param {Function} handler Route handler.
 * @returns {Function} Wrapped handler.
 */
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

/**
 * Formats API errors with the standard envelope.
 * @param {Error} err Error object.
 * @param {import("express").Request} _req Request.
 * @param {import("express").Response} res Response.
 * @param {import("express").NextFunction} _next Next.
 * @returns {import("express").Response}
 */
function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    error: { message: status >= 500 ? "Something went wrong" : err.message, code: err.code || "INTERNAL_ERROR" }
  });
}

module.exports = { AppError, NotFoundError, ValidationError, asyncHandler, errorHandler };
