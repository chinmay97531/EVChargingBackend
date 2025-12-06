"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statistics_controller_1 = require("../controllers/statistics.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const statisticsController = new statistics_controller_1.StatisticsController();
router.get("/", auth_1.authMiddleware, statisticsController.getStatistics);
exports.default = router;
