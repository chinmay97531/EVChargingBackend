import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { ChargingScheduleService } from "../services/chargingSchedule.service";
import { sendSuccess, sendError } from "../utils/response";

export class ChargingScheduleController {
  private chargingScheduleService: ChargingScheduleService;

  constructor() {
    this.chargingScheduleService = new ChargingScheduleService();
  }

  predict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { hour, demand, solar } = req.body;

      if (hour === undefined || demand === undefined || solar === undefined) {
        sendError(res, "hour, demand, and solar are required", 400);
        return;
      }

      const result = await this.chargingScheduleService.predict({
        hour: parseInt(hour),
        demand: parseInt(demand),
        solar: parseInt(solar),
      });

      sendSuccess(res, result, "Charging schedule prediction retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Failed to get prediction", 500, error);
    }
  };
}

