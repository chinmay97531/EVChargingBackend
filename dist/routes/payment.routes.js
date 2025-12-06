"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const paymentController = new payment_controller_1.PaymentController();
router.get("/data", auth_1.authMiddleware, paymentController.getPaymentData);
exports.default = router;
