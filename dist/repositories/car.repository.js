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
exports.CarRepository = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
class CarRepository {
    findById(carId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const car = yield prisma_1.default.car.findFirst({
                where: {
                    id: carId,
                    userId: userId,
                },
                include: {
                    batteryHistory: {
                        orderBy: {
                            timestamp: "desc",
                        },
                        take: 1,
                    },
                },
            });
            if (!car) {
                throw new errors_1.NotFoundError("Car not found");
            }
            return car;
        });
    }
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.car.findMany({
                where: {
                    userId: userId,
                },
                include: {
                    batteryHistory: {
                        orderBy: {
                            timestamp: "desc",
                        },
                        take: 1,
                    },
                },
            });
        });
    }
    deleteById(carId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const car = yield prisma_1.default.car.findFirst({
                where: {
                    id: carId,
                    userId: userId,
                },
            });
            if (!car) {
                throw new errors_1.NotFoundError("Car not found");
            }
            yield prisma_1.default.car.delete({
                where: {
                    id: carId,
                },
            });
            return { message: "Car deleted successfully" };
        });
    }
    createBatteryHistory(carId, soc, soh) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.batteryHistory.create({
                data: {
                    carId,
                    soc,
                    soh,
                },
            });
        });
    }
    getBatteryHistory(carId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { carId };
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate)
                    where.timestamp.gte = startDate;
                if (endDate)
                    where.timestamp.lte = endDate;
            }
            return yield prisma_1.default.batteryHistory.findMany({
                where,
                orderBy: {
                    timestamp: "asc",
                },
            });
        });
    }
}
exports.CarRepository = CarRepository;
