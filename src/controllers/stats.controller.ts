import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { StatisticsService } from "../services/statistics.service";
import { sendSuccess, sendError } from "../utils/response";

export class StatsController {
  private statisticsService: StatisticsService;

  constructor() {
    this.statisticsService = new StatisticsService();
  }

  sessionsOverTime = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const data = await this.statisticsService.getSessionsOverTime(userId, startDate, endDate);

      // map to { label, value }
      const granularity = (req.query.granularity as string) || "daily";
      const mapped = data.map((d: any) => ({ label: d.date, value: d.count }));
      const result = this.groupByGranularity(mapped, granularity);
      sendSuccess(res, result, "Sessions over time");
    } catch (err) {
      sendError(res, "Failed to fetch sessions over time", 500, err);
    }
  };

  revenueOverTime = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const data = await this.statisticsService.getRevenueTrends(userId, startDate, endDate);
      const granularity = (req.query.granularity as string) || "daily";
      const mapped = data.map((d: any) => ({ label: d.date, value: d.amount }));
      const result = this.groupByGranularity(mapped, granularity);
      sendSuccess(res, result, "Revenue over time");
    } catch (err) {
      sendError(res, "Failed to fetch revenue trends", 500, err);
    }
  };

  energyConsumption = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const data = await this.statisticsService.getEnergyConsumption(userId, startDate, endDate);
      const granularity = (req.query.granularity as string) || "daily";
      const mapped = data.map((d: any) => ({ label: d.date, value: d.total }));
      const result = this.groupByGranularity(mapped, granularity);
      sendSuccess(res, result, "Energy consumption over time");
    } catch (err) {
      sendError(res, "Failed to fetch energy consumption", 500, err);
    }
  };

  socTrends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const carId = req.query.carId ? parseInt(req.query.carId as string) : undefined;
      if (!carId) {
        sendError(res, "carId is required", 400);
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const data = await this.statisticsService.getSoCTrends(carId, startDate, endDate);
      const result = data.map((d: any) => ({ label: d.date, value: d.soc }));
      sendSuccess(res, result, "State of Charge trends");
    } catch (err) {
      sendError(res, "Failed to fetch SOC trends", 500, err);
    }
  };

  paymentsByMode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const data = await this.statisticsService.getPaymentsByMode(userId, startDate, endDate);
      // data: [{ mode, amount }]
      const result = data.map((d: any) => ({ label: d.mode, value: d.amount }));
      sendSuccess(res, result, "Payments by mode");
    } catch (err) {
      sendError(res, "Failed to fetch payments by mode", 500, err);
    }
  };

  // helper to group daily data into weekly/monthly buckets
  private groupByGranularity(items: { label: string; value: number }[], granularity: string) {
    if (!items || items.length === 0) return [];
    if (granularity === "daily") return items;

    const grouped: Record<string, number> = {};

    items.forEach((it) => {
      const d = new Date(it.label);
      let key = it.label;
      if (granularity === "weekly") {
        // ISO week key: YYYY-WW
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      } else if (granularity === "monthly") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
      grouped[key] = (grouped[key] || 0) + it.value;
    });

    return Object.entries(grouped).map(([label, value]) => ({ label, value }));
  }
}

export default StatsController;
