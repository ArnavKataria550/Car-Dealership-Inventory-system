import express, { type Express } from 'express';

/**
 * Builds the Express application without binding it to a port.
 *
 * Keeping construction separate from `listen()` lets tests exercise the
 * full HTTP stack in-process with Supertest, and lets server.ts own the
 * process-level concerns (port, startup logging).
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}
