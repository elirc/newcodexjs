/**
 * Sanitizes text input by trimming whitespace and removing angle brackets used in simple HTML tags.
 *
 * @param {string} value - Raw string value from a request body.
 * @returns {string} Sanitized string safe to persist as plain text.
 */
function sanitizeString(value) {
  return value.trim().replace(/[<>]/g, '');
}

module.exports = {
  sanitizeString
};
