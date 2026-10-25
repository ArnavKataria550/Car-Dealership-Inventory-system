import type { Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConflictError } from '../../../src/errors/app-error.js';
import { errorHandler } from '../../../src/middleware/error-handler.js';

/** Minimal Express response double that records the status and JSON body. */
function fakeResponse() {
  const res = { statusCode: 0, body: undefined as unknown };
  const response = {
    status(code: number) {
      res.statusCode = code;
      return response;
    },
    json(body: unknown) {
      res.body = body;
      return response;
    },
  };
  return { res, response: response as unknown as Response };
}

describe('errorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers an AppError with its status, code and message', () => {
    const { res, response } = fakeResponse();

    errorHandler(new ConflictError('Already exists'), {} as Request, response, vi.fn());

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: { code: 'CONFLICT', message: 'Already exists' } });
  });

  it('answers an unexpected error with a generic 500 that leaks nothing', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { res, response } = fakeResponse();
    const internal = new Error('connection to db-prod-7 refused: password=hunter2');

    errorHandler(internal, {} as Request, response, vi.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    // ...but the real error is still logged for whoever runs the server.
    expect(logged).toHaveBeenCalledWith(internal);
  });

  it('treats a plain SyntaxError (not from body parsing) as unexpected', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { res, response } = fakeResponse();

    errorHandler(new SyntaxError('bug in our code'), {} as Request, response, vi.fn());

    expect(res.statusCode).toBe(500);
  });
});
