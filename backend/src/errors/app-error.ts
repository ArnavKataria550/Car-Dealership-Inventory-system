/**
 * Base class for expected, client-facing failures. Each subclass carries the
 * HTTP status and a stable machine-readable code, so the error handler can
 * turn any AppError into a response without knowing about specific cases.
 */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** One problem with one field of a request body. */
export interface FieldError {
  field: string;
  message: string;
}

/** 400: the request body failed schema validation. */
export class ValidationError extends AppError {
  constructor(details: FieldError[]) {
    super(400, 'VALIDATION_ERROR', 'Request body is invalid', details);
  }
}

/** 401: missing, invalid or rejected credentials. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/** 403: authenticated, but not allowed to perform this action. */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, 'FORBIDDEN', message);
  }
}

/** 404: the requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

/** 409: the request conflicts with existing state (e.g. duplicate email). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

/** 409: a purchase asked for more units than are in stock. */
export class InsufficientStockError extends AppError {
  constructor(readonly available: number) {
    super(
      409,
      'INSUFFICIENT_STOCK',
      available === 0 ? 'This vehicle is out of stock' : `Only ${available} left in stock`,
    );
  }
}
