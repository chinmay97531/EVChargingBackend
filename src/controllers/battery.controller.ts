import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { BatteryService } from "../services/battery.service";
import { sendSuccess, sendError } from "../utils/response";
import { NotFoundError } from "../utils/errors";

export class BatteryController {
  private batteryService: BatteryService;

  constructor() {
    this.batteryService = new BatteryService();
  }

  getBatteryStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const carId = req.query.carId ? parseInt(req.query.carId as string) : undefined;

      const batteryStatus = await this.batteryService.getBatteryStatus(userId, carId);

      sendSuccess(res, batteryStatus, "Battery status retrieved successfully");
    } catch (error) {
      if (error instanceof NotFoundError) {
        sendError(res, error.message, 404);
        return;
      }
      sendError(res, "Failed to retrieve battery status", 500, error);
    }
  };
}

