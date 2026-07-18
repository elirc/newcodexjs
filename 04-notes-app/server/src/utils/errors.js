class AppError extends Error { constructor(message, statusCode = 500, code = "APP_ERROR") { super(message); this.statusCode = statusCode; this.code = code; } }
class NotFoundError extends AppError { constructor(message = "Not found") { super(message, 404, "NOT_FOUND"); } }
class ValidationError extends AppError { constructor(message = "Invalid request") { super(message, 400, "VALIDATION_ERROR"); } }
module.exports = { AppError, NotFoundError, ValidationError };
