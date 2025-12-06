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
exports.StatisticsService = void 0;
const car_repository_1 = require("../repositories/car.repository");
const payment_repository_1 = require("../repositories/payment.repository");
const booking_repository_1 = require("../repositories/booking.repository");
const energy_repository_1 = require("../repositories/energy.repository");
class StatisticsService {
    constructor() {
        this.carRepository = new car_repository_1.CarRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.bookingRepository = new booking_repository_1.BookingRepository();
        this.energyRepository = new energy_repository_1.EnergyRepository();
    }
    // Public wrappers for granular stats endpoints
    getSessionsOverTime(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.bookingRepository.getChargingSessionsOverTime(userId, startDate, endDate);
        });
    }
    getRevenueTrends(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.paymentRepository.getRevenueTrends(userId, startDate, endDate);
        });
    }
    getEnergyConsumption(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.energyRepository.getEnergyConsumption(userId, startDate, endDate);
        });
    }
    // expose SoC trends publicly for the stats endpoints
    getSoCTrends(carId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getSoCTrendsInternal(carId, startDate, endDate);
        });
    }
    getPaymentsByMode(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // implemented in payment repository
            // returns array of { mode, amount }
            // fallback to computing from payments list if repo method not present
            // We'll call repository method if available
            // @ts-ignore
            if (typeof this.paymentRepository.getPaymentsByMode === "function") {
                // @ts-ignore
                return yield this.paymentRepository.getPaymentsByMode(userId, startDate, endDate);
            }
            const stats = yield this.paymentRepository.getPaymentStats(userId, startDate, endDate);
            const byMode = {};
            (stats.payments || []).forEach((p) => {
                const mode = (p.paymentMode || "UNKNOWN");
                byMode[mode] = (byMode[mode] || 0) + p.amount;
            });
            return Object.entries(byMode).map(([mode, amount]) => ({ mode, amount }));
        });
    }
    getStatistics(userId, carId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // Numerical Statistics
            const paymentStats = yield this.paymentRepository.getPaymentStats(userId, startDate, endDate);
            const sessions = yield this.bookingRepository.getChargingSessions(userId, startDate, endDate);
            const completedSessions = sessions.filter((s) => s.status === "COMPLETED").length;
            const numericalStats = {
                totalChargingSessions: sessions.length,
                completedSessions,
                cancelledSessions: sessions.filter((s) => s.status === "CANCELLED").length,
                totalAmountPaid: paymentStats.totalPaid,
                totalSavings: paymentStats.totalSavings,
                averageSessionDuration: this.calculateAverageSessionDuration(sessions),
                totalEnergyConsumed: yield this.calculateTotalEnergyConsumed(userId, startDate, endDate),
            };
            // Graphical Statistics - Format for Chart.js/Recharts
            const targetCarId = carId || (yield this.getFirstCarId(userId));
            const socTrends = targetCarId
                ? yield this.getSoCTrends(targetCarId, startDate, endDate)
                : [];
            const chargingSessionsOverTime = yield this.bookingRepository.getChargingSessionsOverTime(userId, startDate, endDate);
            const revenueTrends = yield this.paymentRepository.getRevenueTrends(userId, startDate, endDate);
            const energyConsumption = yield this.energyRepository.getEnergyConsumption(userId, startDate, endDate);
            return {
                numerical: numericalStats,
                graphical: {
                    socTrends: {
                        labels: socTrends.map((item) => item.date),
                        datasets: [
                            {
                                label: "State of Charge (%)",
                                data: socTrends.map((item) => item.soc),
                            },
                        ],
                    },
                    chargingSessionsOverTime: {
                        labels: chargingSessionsOverTime.map((item) => item.date),
                        datasets: [
                            {
                                label: "Charging Sessions",
                                data: chargingSessionsOverTime.map((item) => item.count),
                            },
                        ],
                    },
                    revenueTrends: {
                        labels: revenueTrends.map((item) => item.date),
                        datasets: [
                            {
                                label: "Revenue (₹)",
                                data: revenueTrends.map((item) => item.amount),
                            },
                        ],
                    },
                    energyConsumption: {
                        labels: energyConsumption.map((item) => item.date),
                        datasets: [
                            {
                                label: "Grid Electricity (kWh)",
                                data: energyConsumption.map((item) => item.gridElectricity),
                            },
                            {
                                label: "Solar Power (kWh)",
                                data: energyConsumption.map((item) => item.solarPower),
                            },
                            {
                                label: "Total Energy (kWh)",
                                data: energyConsumption.map((item) => item.total),
                            },
                        ],
                    },
                },
            };
        });
    }
    getSoCTrendsInternal(carId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const history = yield this.carRepository.getBatteryHistory(carId, startDate, endDate);
            // Group by date
            const socByDate = {};
            history.forEach((record) => {
                const date = record.timestamp.toISOString().split("T")[0];
                if (!socByDate[date]) {
                    socByDate[date] = [];
                }
                socByDate[date].push(record.soc);
            });
            // Average SOC per date
            return Object.entries(socByDate).map(([date, socs]) => ({
                date,
                soc: socs.reduce((sum, val) => sum + val, 0) / socs.length,
            }));
        });
    }
    calculateAverageSessionDuration(sessions) {
        if (sessions.length === 0)
            return 0;
        const totalDuration = sessions.reduce((sum, session) => {
            const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
            return sum + duration;
        }, 0);
        return totalDuration / sessions.length / (1000 * 60); // Convert to minutes
    }
    calculateTotalEnergyConsumed(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const consumption = yield this.energyRepository.getEnergyConsumption(userId, startDate, endDate);
            return consumption.reduce((sum, item) => sum + item.total, 0);
        });
    }
    getFirstCarId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const cars = yield this.carRepository.findByUserId(userId);
            return (_a = cars[0]) === null || _a === void 0 ? void 0 : _a.id;
        });
    }
}
exports.StatisticsService = StatisticsService;
