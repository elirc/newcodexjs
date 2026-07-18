export class AppError extends Error {
  public statusCode: number;
  public code: string;

  /** Creates an operational error that can be serialized by middleware. */
  constructor(message: string, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  /** Creates a 404 error for missing resources. */
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  /** Creates a 400 error for invalid user input. */
  constructor(message = "Validation failed") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class ConflictError extends AppError {
  /** Creates a 409 error for schedule or state conflicts. */
  constructor(message = "Request conflicts with existing data") {
    super(message, 409, "CONFLICT");
  }
}
