import type { RequestHandler } from 'express';

import { NotFoundError } from '../errors/app-error.js';

/**
 * Catch-all for requests no route matched. Registered after every router so
 * the error handler answers in the API's JSON shape instead of Express's HTML.
 */
export const notFound: RequestHandler = (req) => {
  const path = req.originalUrl.split('?')[0];
  throw new NotFoundError(`Route ${req.method} ${path} not found`);
};
