import { Router } from "express";
import { ChargingScheduleController } from "../controllers/chargingSchedule.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const chargingScheduleController = new ChargingScheduleController();

router.post("/predict", authMiddleware, chargingScheduleController.predict);

export default router;

