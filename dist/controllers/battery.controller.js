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
exports.BatteryController = void 0;
const battery_service_1 = require("../services/battery.service");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
class BatteryController {
    constructor() {
        this.getBatteryStatus = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const carId = req.query.carId ? parseInt(req.query.carId) : undefined;
                const batteryStatus = yield this.batteryService.getBatteryStatus(userId, carId);
                (0, response_1.sendSuccess)(res, batteryStatus, "Battery status retrieved successfully");
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundError) {
                    (0, response_1.sendError)(res, error.message, 404);
                    return;
                }
                (0, response_1.sendError)(res, "Failed to retrieve battery status", 500, error);
            }
        });
        this.batteryService = new battery_service_1.BatteryService();
    }
}
exports.BatteryController = BatteryController;
