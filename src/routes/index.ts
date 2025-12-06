import { Router } from "express";
import batteryRoutes from "./battery.routes";
import paymentRoutes from "./payment.routes";
import statisticsRoutes from "./statistics.routes";
import statsRoutes from "./stats.routes";
import carRoutes from "./car.routes";
import chargingScheduleRoutes from "./chargingSchedule.routes";

const router = Router();

router.use("/battery", batteryRoutes);
router.use("/payment", paymentRoutes);
router.use("/statistics", statisticsRoutes);
router.use("/stats", statsRoutes);
router.use("/cars", carRoutes);
router.use("/charging-schedule", chargingScheduleRoutes);

export default router;

