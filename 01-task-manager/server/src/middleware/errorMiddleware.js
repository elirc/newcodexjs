const { AppError, NotFoundError } = require('../utils/errors');

/**
 * Converts unmatched routes into a NotFoundError so 404 responses share the error envelope.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next callback.
 * @returns {void}
 */
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`));
}

/**
 * Formats all errors into the required response envelope and hides unexpected internals.
 *
 * @param {Error} err - Error thrown by route, service, or middleware code.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next callback.
 * @returns {object} Express JSON response.
 */
function errorHandler(err, req, res, next) {
  const isOperational = err instanceof AppError && err.isOperational;
  const statusCode = isOperational ? err.statusCode : 500;
  const message = isOperational ? err.message : 'An unexpected error occurred.';
  const code = isOperational ? err.code : 'INTERNAL_ERROR';

  if (!isOperational) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
