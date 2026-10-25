import type { RequestHandler } from 'express';
import type { z } from 'zod';

import { ValidationError } from '../errors/app-error.js';
import { toFieldErrors } from './zod-field-errors.js';

/**
 * Validates the query string against a Zod schema and stores the parsed,
 * typed result in `res.locals.query`. (Express 5 makes `req.query` a
 * read-only getter, so it cannot be replaced the way `req.body` is.)
 */
export function validateQuery(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw new ValidationError(toFieldErrors(result.error));
    }

    res.locals.query = result.data;
    next();
  };
}
