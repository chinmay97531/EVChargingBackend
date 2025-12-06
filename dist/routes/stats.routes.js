"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = __importDefault(require("../controllers/stats.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new stats_controller_1.default();
router.get("/sessions-over-time", auth_1.authMiddleware, controller.sessionsOverTime);
router.get("/revenue-over-time", auth_1.authMiddleware, controller.revenueOverTime);
router.get("/energy-consumption", auth_1.authMiddleware, controller.energyConsumption);
router.get("/soc-trends", auth_1.authMiddleware, controller.socTrends);
router.get("/payments-by-mode", auth_1.authMiddleware, controller.paymentsByMode);
exports.default = router;
