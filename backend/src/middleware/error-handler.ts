import type { ErrorRequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';

/**
 * Last middleware in the chain: turns any thrown error into a consistent
 * `{ error: { code, message, details? } }` response. Unexpected errors are
 * logged and answered with a generic 500 so internals never leak to clients.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined && { details: error.details }),
      },
    });
    return;
  }

  if (isMalformedJsonError(error)) {
    res.status(400).json({
      error: { code: 'MALFORMED_JSON', message: 'Request body is not valid JSON' },
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
};

/** express.json() reports unparseable bodies as a SyntaxError tagged with this type. */
function isMalformedJsonError(error: unknown): boolean {
  return error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed';
}
