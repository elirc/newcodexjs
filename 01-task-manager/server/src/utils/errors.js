/**
 * Represents an expected application error with HTTP response metadata.
 */
class AppError extends Error {
  /**
   * Builds an operational error so centralized middleware can format it consistently.
   *
   * @param {string} message - Human-readable error message.
   * @param {number} statusCode - HTTP status code to return.
   * @param {string} code - Stable machine-readable error code.
   */
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Represents a missing resource or route in a way clients can handle predictably.
 */
class NotFoundError extends AppError {
  /**
   * Builds a 404 error with a stable code for task and route lookups.
   *
   * @param {string} message - Human-readable error message.
   */
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Represents invalid client input before it reaches the data layer.
 */
class ValidationError extends AppError {
  /**
   * Builds a 400 error with a stable code for validation failures.
   *
   * @param {string} message - Human-readable validation message.
   */
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError
};
