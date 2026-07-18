class AppError extends Error {
  /**
   * Creates an operational error that can be safely shown to API clients.
   * @param {string} message Human-readable message.
   * @param {number} statusCode HTTP status code.
   * @param {string} code Machine-readable error code.
   */
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  /**
   * Creates a 404 error for missing records.
   * @param {string} message Human-readable message.
   */
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

class ValidationError extends AppError {
  /**
   * Creates a 400 error for invalid client input.
   * @param {string} message Human-readable message.
   */
  constructor(message = "Invalid request") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/**
 * Wraps async route handlers so rejected promises flow to error middleware.
 * @param {Function} handler Express handler.
 * @returns {Function} Wrapped handler.
 */
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

/**
 * Returns a consistent JSON error envelope for every thrown error.
 * @param {Error} err Error object.
 * @param {import("express").Request} _req Express request.
 * @param {import("express").Response} res Express response.
 * @param {import("express").NextFunction} _next Express next.
 * @returns {import("express").Response}
 */
function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = status >= 500 ? "Something went wrong" : err.message;
  return res.status(status).json({ success: false, error: { message, code } });
}

module.exports = { AppError, NotFoundError, ValidationError, asyncHandler, errorHandler };
