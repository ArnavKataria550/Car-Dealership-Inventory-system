import { Router, type RequestHandler } from 'express';

import type { PurchaseController } from './purchase.controller.js';

/** Routes mounted at /api/purchases. Every route requires a logged-in user. */
export function createPurchaseRouter(
  controller: PurchaseController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);
  router.get('/', controller.list);

  return router;
}
