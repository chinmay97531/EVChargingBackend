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
exports.BookingRepository = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class BookingRepository {
    getChargingSessions(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { userId };
            if (startDate || endDate) {
                where.startTime = {};
                if (startDate)
                    where.startTime.gte = startDate;
                if (endDate)
                    where.startTime.lte = endDate;
            }
            return yield prisma_1.default.booking.findMany({
                where,
                include: {
                    chargingStation: true,
                },
                orderBy: {
                    startTime: "asc",
                },
            });
        });
    }
    getChargingSessionsOverTime(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getChargingSessions(userId, startDate, endDate);
            // Group by date
            const sessionsByDate = {};
            sessions.forEach((session) => {
                const date = session.startTime.toISOString().split("T")[0];
                sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
            });
            return Object.entries(sessionsByDate).map(([date, count]) => ({
                date,
                count,
            }));
        });
    }
}
exports.BookingRepository = BookingRepository;
