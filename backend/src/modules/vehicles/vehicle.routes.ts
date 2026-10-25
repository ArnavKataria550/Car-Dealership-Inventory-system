import { Router, type RequestHandler } from 'express';

import { requireRole } from '../../middleware/require-role.js';
import { validateBody } from '../../middleware/validate-body.js';
import { validateQuery } from '../../middleware/validate-query.js';
import type { VehicleController } from './vehicle.controller.js';
import {
  createVehicleSchema,
  purchaseSchema,
  restockSchema,
  searchVehiclesSchema,
  updateVehicleSchema,
} from './vehicle.schemas.js';

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
  // Must stay above any `/:id` route so "search" is never read as an id.
  router.get('/search', validateQuery(searchVehiclesSchema), controller.search);
  router.get('/:id', controller.getById);
  router.post('/', adminOnly, validateBody(createVehicleSchema), controller.create);
  router.put('/:id', adminOnly, validateBody(updateVehicleSchema), controller.update);
  router.delete('/:id', adminOnly, controller.delete);

  // Inventory: any logged-in user may buy.
  router.post('/:id/purchase', validateBody(purchaseSchema), controller.purchase);
  router.post('/:id/restock', adminOnly, validateBody(restockSchema), controller.restock);

  return router;
}
