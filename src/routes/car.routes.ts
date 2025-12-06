import { Router } from "express";
import { CarController } from "../controllers/car.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const carController = new CarController();

router.delete("/:carId", authMiddleware, carController.deleteCar);

export default router;

