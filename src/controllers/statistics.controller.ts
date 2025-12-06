import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { StatisticsService } from "../services/statistics.service";
import { sendSuccess, sendError } from "../utils/response";

export class StatisticsController {
  private statisticsService: StatisticsService;

  constructor() {
    this.statisticsService = new StatisticsService();
  }

  getStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const carId = req.query.carId ? parseInt(req.query.carId as string) : undefined;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const statistics = await this.statisticsService.getStatistics(
        userId,
        carId,
        startDate,
        endDate
      );

      sendSuccess(res, statistics, "Statistics retrieved successfully");
    } catch (error) {
      sendError(res, "Failed to retrieve statistics", 500, error);
    }
  };
}

