import type { RequestHandler } from 'express';

import type { CreateVehicleBody } from './vehicle.schemas.js';
import type { VehicleService } from './vehicle.service.js';

/** Translates HTTP requests into VehicleService calls. Bodies are pre-validated by the router. */
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  create: RequestHandler = async (req, res) => {
    const vehicle = await this.vehicleService.create(req.body as CreateVehicleBody);
    res.status(201).json({ vehicle });
  };

  list: RequestHandler = async (_req, res) => {
    const vehicles = await this.vehicleService.list();
    res.status(200).json({ vehicles });
  };
}
