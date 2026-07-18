/**
 * Sends successful JSON in the standard envelope.
 * @param {import("express").Response} res Express response.
 * @param {unknown} data Payload.
 * @param {number} status HTTP status.
 * @returns {import("express").Response}
 */
function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

module.exports = { sendSuccess };
