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
exports.StatisticsController = void 0;
const statistics_service_1 = require("../services/statistics.service");
const response_1 = require("../utils/response");
class StatisticsController {
    constructor() {
        this.getStatistics = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const carId = req.query.carId ? parseInt(req.query.carId) : undefined;
                const startDate = req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const statistics = yield this.statisticsService.getStatistics(userId, carId, startDate, endDate);
                (0, response_1.sendSuccess)(res, statistics, "Statistics retrieved successfully");
            }
            catch (error) {
                (0, response_1.sendError)(res, "Failed to retrieve statistics", 500, error);
            }
        });
        this.statisticsService = new statistics_service_1.StatisticsService();
    }
}
exports.StatisticsController = StatisticsController;
