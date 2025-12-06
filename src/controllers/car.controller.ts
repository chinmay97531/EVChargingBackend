import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { CarService } from "../services/car.service";
import { sendSuccess, sendError } from "../utils/response";
import { NotFoundError } from "../utils/errors";

export class CarController {
  private carService: CarService;

  constructor() {
    this.carService = new CarService();
  }

  deleteCar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const carId = parseInt(req.params.carId);

      if (isNaN(carId)) {
        sendError(res, "Invalid car ID", 400);
        return;
      }

      const result = await this.carService.deleteCar(carId, userId);

      sendSuccess(res, result, "Car deleted successfully");
    } catch (error) {
      if (error instanceof NotFoundError) {
        sendError(res, error.message, 404);
        return;
      }
      sendError(res, "Failed to delete car", 500, error);
    }
  };
}

