const { AppError } = require("../utils/errors");

/** Converts thrown errors into the standard error envelope. */
function errorMiddleware(error, _req, res, _next) { const appError = error instanceof AppError ? error : new AppError(error.message); return res.status(appError.statusCode).json({ success: false, error: { message: appError.message, code: appError.code } }); }

/** Handles unmatched routes. */
function notFoundMiddleware(_req, res) { return res.status(404).json({ success: false, error: { message: "Route not found", code: "NOT_FOUND" } }); }
module.exports = { errorMiddleware, notFoundMiddleware };
