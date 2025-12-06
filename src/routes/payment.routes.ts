import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const paymentController = new PaymentController();

router.get("/data", authMiddleware, paymentController.getPaymentData);

export default router;

