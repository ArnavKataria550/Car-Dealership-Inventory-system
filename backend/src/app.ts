import express, { type Express } from 'express';

import { createDependencies, type AppDependencies } from './container.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { VehicleController } from './modules/vehicles/vehicle.controller.js';
import { createVehicleRouter } from './modules/vehicles/vehicle.routes.js';

/**
 * Builds the Express application without binding it to a port.
 *
 * Keeping construction separate from `listen()` lets tests exercise the
 * full HTTP stack in-process with Supertest, and lets server.ts own the
 * process-level concerns (port, startup logging).
 */
export function createApp(dependencies: AppDependencies = createDependencies()): Express {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const authenticate = createAuthenticate(dependencies.tokenService);

  app.use('/api/auth', createAuthRouter(new AuthController(dependencies.authService)));
  app.use(
    '/api/vehicles',
    createVehicleRouter(new VehicleController(dependencies.vehicleService), authenticate),
  );

  // Both must be registered after all routes, in this order.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
