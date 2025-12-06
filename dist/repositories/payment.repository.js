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
exports.PaymentRepository = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class PaymentRepository {
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.payment.findMany({
                where: {
                    userId: userId,
                },
                include: {
                    booking: {
                        include: {
                            chargingStation: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        });
    }
    getPaymentStats(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { userId };
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const payments = yield prisma_1.default.payment.findMany({
                where,
            });
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const totalSavings = payments.reduce((sum, p) => sum + (p.savings || 0), 0);
            return {
                totalPaid,
                totalSavings,
                totalPayments: payments.length,
                payments,
            };
        });
    }
    getRevenueTrends(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { userId, status: "SUCCESS" };
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const payments = yield prisma_1.default.payment.findMany({
                where,
                orderBy: {
                    createdAt: "asc",
                },
            });
            // Group by date
            const revenueByDate = {};
            payments.forEach((payment) => {
                const date = payment.createdAt.toISOString().split("T")[0];
                revenueByDate[date] = (revenueByDate[date] || 0) + payment.amount;
            });
            return Object.entries(revenueByDate).map(([date, amount]) => ({
                date,
                amount,
            }));
        });
    }
    getPaymentsByMode(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { userId };
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const payments = yield prisma_1.default.payment.findMany({ where });
            const byMode = {};
            payments.forEach((p) => {
                const mode = p.paymentMode || "UNKNOWN";
                byMode[mode] = (byMode[mode] || 0) + p.amount;
            });
            return Object.entries(byMode).map(([mode, amount]) => ({ mode, amount }));
        });
    }
}
exports.PaymentRepository = PaymentRepository;
