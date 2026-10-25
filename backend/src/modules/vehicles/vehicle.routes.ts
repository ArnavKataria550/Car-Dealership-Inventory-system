import { Router, type RequestHandler } from 'express';

import { requireRole } from '../../middleware/require-role.js';
import { validateBody } from '../../middleware/validate-body.js';
import type { VehicleController } from './vehicle.controller.js';
import { createVehicleSchema } from './vehicle.schemas.js';

/**
 * Routes mounted at /api/vehicles. Every route requires a logged-in user;
 * changes to the catalogue additionally require the ADMIN role.
 * Auth runs before validation, so anonymous callers always get 401, never 400.
 */
export function createVehicleRouter(
  controller: VehicleController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const adminOnly = requireRole('ADMIN');

  router.use(authenticate);

  router.get('/', controller.list);
  router.post('/', adminOnly, validateBody(createVehicleSchema), controller.create);

  return router;
}
