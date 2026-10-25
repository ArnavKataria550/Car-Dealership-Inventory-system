import type { RequestHandler } from 'express';

import type {
  CreateVehicleBody,
  PurchaseBody,
  RestockBody,
  SearchVehiclesQuery,
  UpdateVehicleBody,
} from './vehicle.schemas.js';
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

  search: RequestHandler = async (_req, res) => {
    const vehicles = await this.vehicleService.search(res.locals.query as SearchVehiclesQuery);
    res.status(200).json({ vehicles });
  };

  update: RequestHandler<{ id: string }> = async (req, res) => {
    const vehicle = await this.vehicleService.update(req.params.id, req.body as UpdateVehicleBody);
    res.status(200).json({ vehicle });
  };

  delete: RequestHandler<{ id: string }> = async (req, res) => {
    await this.vehicleService.delete(req.params.id);
    res.status(204).end();
  };

  purchase: RequestHandler<{ id: string }> = async (req, res) => {
    const { quantity } = req.body as PurchaseBody;
    const vehicle = await this.vehicleService.purchase(req.params.id, quantity);
    res.status(200).json({ vehicle });
  };

  restock: RequestHandler<{ id: string }> = async (req, res) => {
    const { quantity } = req.body as RestockBody;
    const vehicle = await this.vehicleService.restock(req.params.id, quantity);
    res.status(200).json({ vehicle });
  };
}
