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
      const {
        current_soc,
        required_soc,
        hours_remaining,
        plug_out_time,
        preference,
        solar_kw,
        price,
        station_battery_kwh,
        time_slot,
      } = req.body;

      if (current_soc === undefined || required_soc === undefined) {
        sendError(res, "current_soc and required_soc are required", 400);
        return;
      }

      const result = await this.chargingScheduleService.predict({
        current_soc: parseFloat(current_soc),
        required_soc: parseFloat(required_soc),
        hours_remaining: hours_remaining !== undefined ? parseFloat(hours_remaining) : undefined,
        plug_out_time,
        preference,
        solar_kw: solar_kw !== undefined ? parseFloat(solar_kw) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        station_battery_kwh: station_battery_kwh !== undefined ? parseFloat(station_battery_kwh) : undefined,
        time_slot: time_slot !== undefined ? parseInt(time_slot) : undefined,
      });

      sendSuccess(res, result, "Charging schedule inference retrieved successfully");
    } catch (error: any) {
      sendError(res, error.message || "Failed to get prediction", 500, error);
    }
  };
}

