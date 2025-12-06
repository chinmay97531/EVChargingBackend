"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chargingSchedule_controller_1 = require("../controllers/chargingSchedule.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const chargingScheduleController = new chargingSchedule_controller_1.ChargingScheduleController();
router.post("/predict", auth_1.authMiddleware, chargingScheduleController.predict);
exports.default = router;
