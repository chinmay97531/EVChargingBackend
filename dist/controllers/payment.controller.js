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
exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const response_1 = require("../utils/response");
class PaymentController {
    constructor() {
        this.getPaymentData = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.userId);
                const startDate = req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined;
                const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
                const paymentData = yield this.paymentService.getPaymentData(userId, startDate, endDate);
                (0, response_1.sendSuccess)(res, paymentData, "Payment data retrieved successfully");
            }
            catch (error) {
                (0, response_1.sendError)(res, "Failed to retrieve payment data", 500, error);
            }
        });
        this.paymentService = new payment_service_1.PaymentService();
    }
}
exports.PaymentController = PaymentController;
