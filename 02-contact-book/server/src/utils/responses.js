/**
 * Sends a successful API response in the project-standard envelope.
 * @param {import("express").Response} res Express response.
 * @param {unknown} data Payload to expose to the client.
 * @param {number} status HTTP status code.
 * @returns {import("express").Response}
 */
function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

module.exports = { sendSuccess };
