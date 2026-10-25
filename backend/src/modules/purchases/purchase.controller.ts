import type { RequestHandler } from 'express';

import { UnauthorizedError } from '../../errors/app-error.js';
import type { PurchaseService } from './purchase.service.js';

/** Translates HTTP requests into PurchaseService calls. */
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  list: RequestHandler = async (req, res) => {
    // authenticate runs on every purchases route, so this only guards against misconfiguration.
    if (!req.user) throw new UnauthorizedError();
    const purchases = await this.purchaseService.listFor(req.user);
    res.status(200).json({ purchases });
  };
}
