/**
 * Wraps async route handlers so rejected promises flow into centralized error middleware.
 *
 * @param {Function} handler - Async Express route handler.
 * @returns {Function} Express middleware that forwards thrown errors.
 */
function asyncHandler(handler) {
  /**
   * Executes a route handler and forwards any rejection to Express error middleware.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next callback.
   * @returns {Promise<void>} Promise that resolves after the handler settles.
   */
  return function wrappedRouteHandler(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = {
  asyncHandler
};
