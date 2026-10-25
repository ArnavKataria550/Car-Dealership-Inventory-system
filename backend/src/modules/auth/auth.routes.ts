import { Router } from 'express';

import { validateBody } from '../../middleware/validate-body.js';
import type { AuthController } from './auth.controller.js';
import { registerSchema } from './auth.schemas.js';

/** Routes mounted at /api/auth. */
export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/register', validateBody(registerSchema), controller.register);

  return router;
}
