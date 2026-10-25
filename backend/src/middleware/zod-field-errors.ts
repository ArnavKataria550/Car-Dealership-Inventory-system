import type { z } from 'zod';

import type { FieldError } from '../errors/app-error.js';

/** Flattens Zod issues into the API's `[{ field, message }]` error details. */
export function toFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}
