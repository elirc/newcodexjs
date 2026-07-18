export class AppError extends Error {
  constructor(message: string, public statusCode = 500, public code = "APP_ERROR") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super(message, 400, "VALIDATION_ERROR");
  }
}
