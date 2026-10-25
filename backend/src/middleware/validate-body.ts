import type { RequestHandler } from 'express';
import type { z } from 'zod';

import { ValidationError } from '../errors/app-error.js';
import { toFieldErrors } from './zod-field-errors.js';

/**
 * Validates `req.body` against a Zod schema. On success the body is replaced
 * with the parsed value (unknown keys stripped, strings trimmed), so handlers
 * only ever see clean data. On failure a ValidationError lists every bad field.
 */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      throw new ValidationError(toFieldErrors(result.error));
    }

    req.body = result.data;
    next();
  };
}
