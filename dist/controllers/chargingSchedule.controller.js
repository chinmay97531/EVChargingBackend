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
exports.ChargingScheduleController = void 0;
const chargingSchedule_service_1 = require("../services/chargingSchedule.service");
const response_1 = require("../utils/response");
class ChargingScheduleController {
    constructor() {
        this.predict = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { hour, demand, solar } = req.body;
                if (hour === undefined || demand === undefined || solar === undefined) {
                    (0, response_1.sendError)(res, "hour, demand, and solar are required", 400);
                    return;
                }
                const result = yield this.chargingScheduleService.predict({
                    hour: parseInt(hour),
                    demand: parseInt(demand),
                    solar: parseInt(solar),
                });
                (0, response_1.sendSuccess)(res, result, "Charging schedule prediction retrieved successfully");
            }
            catch (error) {
                (0, response_1.sendError)(res, error.message || "Failed to get prediction", 500, error);
            }
        });
        this.chargingScheduleService = new chargingSchedule_service_1.ChargingScheduleService();
    }
}
exports.ChargingScheduleController = ChargingScheduleController;
