export class AppError extends Error {
  public statusCode: number;
  public code: string;

  /** Creates an operational error that can be serialized for API consumers. */
  constructor(message: string, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  /** Creates a 404 error for missing saved tester data. */
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  /** Creates a 400 error for invalid request builder data. */
  constructor(message = "Validation failed") {
    super(message, 400, "VALIDATION_ERROR");
  }
}
