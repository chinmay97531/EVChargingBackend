"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const statistics_service_1 = require("../services/statistics.service");
const response_1 = require("../utils/response");
class StatsController {
    constructor() {
        this.sessionsOverTime = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const data = yield this.statisticsService.getSessionsOverTime(userId, startDate, endDate);
                // map to { label, value }
                const granularity = req.query.granularity || "daily";
                const mapped = data.map((d) => ({ label: d.date, value: d.count }));
                const result = this.groupByGranularity(mapped, granularity);
                (0, response_1.sendSuccess)(res, result, "Sessions over time");
            }
            catch (err) {
                (0, response_1.sendError)(res, "Failed to fetch sessions over time", 500, err);
            }
        });
        this.revenueOverTime = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const data = yield this.statisticsService.getRevenueTrends(userId, startDate, endDate);
                const granularity = req.query.granularity || "daily";
                const mapped = data.map((d) => ({ label: d.date, value: d.amount }));
                const result = this.groupByGranularity(mapped, granularity);
                (0, response_1.sendSuccess)(res, result, "Revenue over time");
            }
            catch (err) {
                (0, response_1.sendError)(res, "Failed to fetch revenue trends", 500, err);
            }
        });
        this.energyConsumption = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const data = yield this.statisticsService.getEnergyConsumption(userId, startDate, endDate);
                const granularity = req.query.granularity || "daily";
                const mapped = data.map((d) => ({ label: d.date, value: d.total }));
                const result = this.groupByGranularity(mapped, granularity);
                (0, response_1.sendSuccess)(res, result, "Energy consumption over time");
            }
            catch (err) {
                (0, response_1.sendError)(res, "Failed to fetch energy consumption", 500, err);
            }
        });
        this.socTrends = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const carId = req.query.carId ? parseInt(req.query.carId) : undefined;
                if (!carId) {
                    (0, response_1.sendError)(res, "carId is required", 400);
                    return;
                }
                const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const data = yield this.statisticsService.getSoCTrends(carId, startDate, endDate);
                const result = data.map((d) => ({ label: d.date, value: d.soc }));
                (0, response_1.sendSuccess)(res, result, "State of Charge trends");
            }
            catch (err) {
                (0, response_1.sendError)(res, "Failed to fetch SOC trends", 500, err);
            }
        });
        this.paymentsByMode = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const data = yield this.statisticsService.getPaymentsByMode(userId, startDate, endDate);
                // data: [{ mode, amount }]
                const result = data.map((d) => ({ label: d.mode, value: d.amount }));
                (0, response_1.sendSuccess)(res, result, "Payments by mode");
            }
            catch (err) {
                (0, response_1.sendError)(res, "Failed to fetch payments by mode", 500, err);
            }
        });
        this.statisticsService = new statistics_service_1.StatisticsService();
    }
    // helper to group daily data into weekly/monthly buckets
    groupByGranularity(items, granularity) {
        if (!items || items.length === 0)
            return [];
        if (granularity === "daily")
            return items;
        const grouped = {};
        items.forEach((it) => {
            const d = new Date(it.label);
            let key = it.label;
            if (granularity === "weekly") {
                // ISO week key: YYYY-WW
                const onejan = new Date(d.getFullYear(), 0, 1);
                const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
                key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
            }
            else if (granularity === "monthly") {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }
            grouped[key] = (grouped[key] || 0) + it.value;
        });
        return Object.entries(grouped).map(([label, value]) => ({ label, value }));
    }
}
exports.StatsController = StatsController;
exports.default = StatsController;
