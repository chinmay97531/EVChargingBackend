import axios from "axios";
import { PYTHON_SERVICE_URL } from "../config";

export interface ChargingScheduleRequest {
  hour: number;
  demand: number;
  solar: number;
}

export interface ChargingScheduleResponse {
  action: number;
  status: string;
  error?: string;
}

export class ChargingScheduleService {
  async predict(request: ChargingScheduleRequest): Promise<ChargingScheduleResponse> {
    try {
      const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
        hour: request.hour,
        demand: request.demand,
        solar: request.solar,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to get charging schedule prediction"
      );
    }
  }
}

