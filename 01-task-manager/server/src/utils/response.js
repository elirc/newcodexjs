/**
 * Sends a successful response envelope so every endpoint returns the same outer shape.
 *
 * @param {object} res - Express response object.
 * @param {unknown} data - Response payload.
 * @param {number} statusCode - HTTP status code to send.
 * @returns {object} Express response result.
 */
function sendSuccess(res, data, statusCode) {
  return res.status(statusCode || 200).json({
    success: true,
    data
  });
}

module.exports = {
  sendSuccess
};
