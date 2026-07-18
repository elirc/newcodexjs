export class AppError extends Error {
  statusCode: number;
  code: string;

  /** Builds an operational error that the error middleware can safely expose. */
  constructor(message: string, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  /** Builds a consistent 404 error for missing resources. */
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  /** Builds a consistent 400 error for invalid client input. */
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  /** Builds a consistent 401 error for missing or invalid auth. */
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  /** Builds a consistent 403 error for valid users without permission. */
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
