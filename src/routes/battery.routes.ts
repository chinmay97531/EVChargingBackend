import { Router } from "express";
import { BatteryController } from "../controllers/battery.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const batteryController = new BatteryController();

router.get("/status", authMiddleware, batteryController.getBatteryStatus);

export default router;

