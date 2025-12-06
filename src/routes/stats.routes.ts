import { Router } from "express";
import StatsController from "../controllers/stats.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const controller = new StatsController();

router.get("/sessions-over-time", authMiddleware, controller.sessionsOverTime);
router.get("/revenue-over-time", authMiddleware, controller.revenueOverTime);
router.get("/energy-consumption", authMiddleware, controller.energyConsumption);
router.get("/soc-trends", authMiddleware, controller.socTrends);
router.get("/payments-by-mode", authMiddleware, controller.paymentsByMode);

export default router;
