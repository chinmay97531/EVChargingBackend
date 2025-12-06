"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const battery_controller_1 = require("../controllers/battery.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const batteryController = new battery_controller_1.BatteryController();
router.get("/status", auth_1.authMiddleware, batteryController.getBatteryStatus);
exports.default = router;
