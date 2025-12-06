import { Router } from "express";
import { StatisticsController } from "../controllers/statistics.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const statisticsController = new StatisticsController();

router.get("/", authMiddleware, statisticsController.getStatistics);

export default router;

