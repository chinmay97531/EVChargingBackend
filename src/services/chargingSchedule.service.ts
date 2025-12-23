import axios from "axios";
import { PYTHON_SERVICE_URL } from "../config";

export interface ChargingScheduleRequest {
  current_soc: number;
  required_soc: number;
  hours_remaining?: number;
  plug_out_time?: string;
  preference?: string;
  solar_kw?: number;
  price?: number;
  station_battery_kwh?: number;
  time_slot?: number;
}

export interface ChargingScheduleResponse {
  status: string;
  result?: any;
  error?: string;
  message?: string;
}

export class ChargingScheduleService {
  async predict(request: ChargingScheduleRequest): Promise<ChargingScheduleResponse> {
    try {
      const response = await axios.post(`${PYTHON_SERVICE_URL}/infer`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to get charging schedule prediction"
      );
    }
  }
}

