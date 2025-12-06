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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnergyRepository = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class EnergyRepository {
    getEnergyConsumption(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get user's bookings to find associated charging stations
            const bookings = yield prisma_1.default.booking.findMany({
                where: Object.assign({ userId }, (startDate || endDate
                    ? {
                        startTime: Object.assign(Object.assign({}, (startDate ? { gte: startDate } : {})), (endDate ? { lte: endDate } : {})),
                    }
                    : {})),
                include: {
                    chargingStation: {
                        include: {
                            energyUsage: {
                                where: Object.assign({}, (startDate || endDate
                                    ? {
                                        update5Min: Object.assign(Object.assign({}, (startDate ? { gte: startDate } : {})), (endDate ? { lte: endDate } : {})),
                                    }
                                    : {})),
                                orderBy: {
                                    update5Min: "asc",
                                },
                            },
                            solarUsage: {
                                where: Object.assign({}, (startDate || endDate
                                    ? {
                                        update5Min: Object.assign(Object.assign({}, (startDate ? { gte: startDate } : {})), (endDate ? { lte: endDate } : {})),
                                    }
                                    : {})),
                                orderBy: {
                                    update5Min: "asc",
                                },
                            },
                        },
                    },
                },
            });
            // Aggregate energy consumption by date
            const energyByDate = {};
            bookings.forEach((booking) => {
                const station = booking.chargingStation;
                station.energyUsage.forEach((usage) => {
                    const date = usage.update5Min.toISOString().split("T")[0];
                    if (!energyByDate[date]) {
                        energyByDate[date] = { grid: 0, solar: 0 };
                    }
                    energyByDate[date].grid += usage.gridElectricityUsed;
                });
                station.solarUsage.forEach((usage) => {
                    const date = usage.update5Min.toISOString().split("T")[0];
                    if (!energyByDate[date]) {
                        energyByDate[date] = { grid: 0, solar: 0 };
                    }
                    energyByDate[date].solar += usage.currentSolarPower;
                });
            });
            return Object.entries(energyByDate).map(([date, energy]) => ({
                date,
                gridElectricity: energy.grid,
                solarPower: energy.solar,
                total: energy.grid + energy.solar,
            }));
        });
    }
}
exports.EnergyRepository = EnergyRepository;
