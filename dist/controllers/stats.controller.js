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
                const result = data.map((d) => ({ label: d.date, value: d.count }));
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
                const result = data.map((d) => ({ label: d.date, value: d.amount }));
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
                const result = data.map((d) => ({ label: d.date, value: d.total }));
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
}
exports.StatsController = StatsController;
exports.default = StatsController;
