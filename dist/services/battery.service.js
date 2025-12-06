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
exports.BatteryService = void 0;
const car_repository_1 = require("../repositories/car.repository");
const errors_1 = require("../utils/errors");
class BatteryService {
    constructor() {
        this.carRepository = new car_repository_1.CarRepository();
    }
    getBatteryStatus(userId, carId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            let car;
            if (carId) {
                car = yield this.carRepository.findById(carId, userId);
            }
            else {
                const cars = yield this.carRepository.findByUserId(userId);
                if (cars.length === 0) {
                    throw new errors_1.NotFoundError("No cars found for this user");
                }
                car = cars[0]; // Get first car if no carId specified
            }
            const latestHistory = car.batteryHistory[0];
            return {
                carId: car.id,
                carName: car.name,
                carModel: car.model,
                soc: (_a = latestHistory === null || latestHistory === void 0 ? void 0 : latestHistory.soc) !== null && _a !== void 0 ? _a : car.currentBatteryStatus,
                soh: (_b = latestHistory === null || latestHistory === void 0 ? void 0 : latestHistory.soh) !== null && _b !== void 0 ? _b : car.currentBatteryHealth,
                timestamp: (_c = latestHistory === null || latestHistory === void 0 ? void 0 : latestHistory.timestamp) !== null && _c !== void 0 ? _c : new Date(),
                date: (_e = (_d = latestHistory === null || latestHistory === void 0 ? void 0 : latestHistory.timestamp) === null || _d === void 0 ? void 0 : _d.toISOString().split("T")[0]) !== null && _e !== void 0 ? _e : new Date().toISOString().split("T")[0],
            };
        });
    }
}
exports.BatteryService = BatteryService;
