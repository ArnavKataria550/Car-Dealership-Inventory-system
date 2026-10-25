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

/** 409: the request conflicts with existing state (e.g. duplicate email). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}
